// user-service/src/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Anubhuti User Service
// Responsibilities:
//   POST /auth/verify-passcode  → validate Supabase access code, return JWT
//   POST /auth/refresh          → rotate JWT using refresh token
//   POST /auth/logout           → blacklist current JWT in Redis
//   GET  /users/:id             → fetch user profile
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { createClient as createRedis } from 'redis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

// ─── Clients ──────────────────────────────────────────────────────────────────
const supabase = createSupabase(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const redis = createRedis({ url: process.env.REDIS_URL });
redis.on('error', err => logger.error({ err }, 'Redis error'));
await redis.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

function issueTokenPair(userId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    { sub: userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
}

// ─── POST /auth/verify-passcode ───────────────────────────────────────────────
// Validates the access code against Supabase (existing logic from your frontend),
// creates or fetches the user record, and issues a JWT pair.
app.post('/auth/verify-passcode', async (req, res) => {
  const { code, email } = req.body as { code: string; email?: string };

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  // Admin bypass (mirrors existing frontend logic)
  if (code === process.env.ADMIN_BYPASS_CODE) {
    const { accessToken, refreshToken } = issueTokenPair('admin', 'admin@anubhuti.local', 'admin');
    await storeRefreshToken('admin', refreshToken);
    res.json({ accessToken, refreshToken });
    return;
  }

  // Validate against Supabase access_codes table
  let query = supabase
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (email) {
    query = query.eq('email', email);
  }

  const { data, error } = await query.limit(1);

  if (error || !data || data.length === 0) {
    res.status(401).json({ error: 'Invalid or expired passcode' });
    return;
  }

  const record = data[0];
  const userEmail = record.email || email || 'unknown@anubhuti.local';
  const userId = record.id;

  const { accessToken, refreshToken } = issueTokenPair(userId, userEmail, 'customer');
  await storeRefreshToken(userId, refreshToken);

  logger.info({ userId, userEmail }, 'Passcode verified, tokens issued');
  res.json({ accessToken, refreshToken, userId, email: userEmail });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string; type: string };
    if (payload.type !== 'refresh') throw new Error('Not a refresh token');

    // Verify it's in Redis (not revoked)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await redis.get(`refresh:${payload.sub}:${tokenHash}`);
    if (!stored) {
      res.status(401).json({ error: 'Refresh token revoked or expired' });
      return;
    }

    // Issue new pair (rotation)
    await redis.del(`refresh:${payload.sub}:${tokenHash}`);
    const { accessToken: newAccess, refreshToken: newRefresh } = issueTokenPair(
      payload.sub, stored, 'customer'
    );
    await storeRefreshToken(payload.sub, newRefresh);

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
app.post('/auth/logout', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    // Add to blacklist with the token's remaining TTL
    try {
      const payload = jwt.decode(token) as { exp: number };
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.setEx(`blacklist:${token}`, ttl, '1');
    } catch { /* ignore decode errors */ }
  }

  // Revoke all refresh tokens for this user
  if (userId) {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(keys);
  }

  res.json({ loggedOut: true });
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────
app.get('/users/:id', async (req, res) => {
  const requestingUserId = req.headers['x-user-id'] as string;

  // Users can only fetch their own profile (admins can fetch any)
  if (req.params.id !== requestingUserId && req.headers['x-user-role'] !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { data, error } = await supabase
    .from('access_codes')
    .select('id, email, created_at')
    .eq('id', req.params.id)
    .limit(1);

  if (error || !data?.length) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: data[0] });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function storeRefreshToken(userId: string, refreshToken: string) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  // Store email as value so we can reconstruct JWT on refresh
  // TTL: 7 days in seconds
  await redis.setEx(`refresh:${userId}:${tokenHash}`, 7 * 24 * 3600, userId);
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', service: 'user-service' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

const PORT = parseInt(process.env.PORT || '3001');
app.listen(PORT, () => logger.info(`User Service running on :${PORT}`));
