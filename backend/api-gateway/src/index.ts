// ─────────────────────────────────────────────────────────────────────────────
// Anubhuti API Gateway
// Responsibilities:
//   1. JWT verification on every protected route
//   2. Per-IP and per-user rate limiting (stored in Redis)
//   3. Idempotency key validation (prevents duplicate order submissions)
//   4. Request proxying to downstream services
//   5. Correlation ID injection for distributed tracing
// ─────────────────────────────────────────────────────────────────────────────

import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createClient } from "redis";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import pino from "pino";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// ─── Redis client ─────────────────────────────────────────────────────────────
const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => logger.error({ err }, "Redis connection error"));
await redis.connect();

// ─── Correlation ID middleware ────────────────────────────────────────────────
// Injects X-Correlation-ID into every request so you can trace a single
// request across all microservices in Grafana/Loki logs.
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.headers["x-correlation-id"] =
    (req.headers["x-correlation-id"] as string) || randomUUID();
  next();
});

// ─── Rate Limiter (Redis sliding window) ─────────────────────────────────────
// Uses a sliding window counter in Redis.
// Anonymous: 100 req/min per IP
// Authenticated: 1000 req/min per user ID
const rateLimiter = (maxAnon: number, maxAuth: number) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
    const windowStart = now - windowMs;

    // Identify the subject: prefer userId from JWT, fall back to IP
    let subject = req.ip!;
    let limit = maxAnon;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = jwt.verify(
          authHeader.slice(7),
          process.env.JWT_SECRET!
        ) as { sub: string };
        subject = `user:${payload.sub}`;
        limit = maxAuth;
      } catch {
        // Not a valid token — treat as anonymous
      }
    }

    const key = `ratelimit:${subject}`;

    // Atomic sliding window using Redis sorted sets
    const pipe = redis.multi();
    pipe.zRemRangeByScore(key, 0, windowStart);   // remove old entries
    pipe.zAdd(key, [{ score: now, value: `${now}-${randomUUID()}` }]);
    pipe.zCard(key);
    pipe.expire(key, Math.ceil(windowMs / 1000));
    const results = await pipe.exec();

    const count = results[2] as number;

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count));
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

    if (count > limit) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil(windowMs / 1000),
      });
      return;
    }

    next();
  };

// ─── JWT Auth middleware ──────────────────────────────────────────────────────
// Verifies the JWT and attaches the decoded payload to the request headers
// so downstream services can trust the user identity WITHOUT re-verifying.
const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  // Check token blacklist (covers logged-out tokens still within TTL)
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    res.status(401).json({ error: "Token has been revoked" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Forward verified identity as internal headers — downstream services
    // trust these WITHOUT doing their own JWT verification.
    req.headers["x-user-id"] = payload.sub;
    req.headers["x-user-email"] = payload.email;
    req.headers["x-user-role"] = payload.role;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  }
};

// ─── Idempotency middleware (for POST /orders) ────────────────────────────────
// Prevents duplicate order creation if the client retries a timed-out request.
// The client must send an Idempotency-Key header (a UUID they generate).
// If we've seen this key in the last 24h, we return the cached response.
const idempotencyCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.headers["idempotency-key"] as string;
  if (!key) {
    res.status(400).json({
      error: "Idempotency-Key header is required for order creation",
    });
    return;
  }

  const cached = await redis.get(`idem:${key}`);
  if (cached) {
    // Return the same response as the original request
    const { status, body } = JSON.parse(cached);
    res.status(status).json(body);
    return;
  }

  // Intercept response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      redis.setEx(
        `idem:${key}`,
        parseInt(process.env.IDEMPOTENCY_KEY_TTL || "86400"),
        JSON.stringify({ status: res.statusCode, body })
      );
    }
    return originalJson(body);
  };

  next();
};

// ─── Proxy factory ────────────────────────────────────────────────────────────
const proxy = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, _req, res) => {
        logger.error({ err }, "Proxy error");
        (res as Response).status(502).json({ error: "Service unavailable" });
      },
    },
  });

// ─── Routes ───────────────────────────────────────────────────────────────────
const rl = rateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_ANON || "100"),
  parseInt(process.env.RATE_LIMIT_MAX_AUTH || "1000")
);

// Public routes (no auth required)
app.use("/api/v1/auth", rl, proxy(process.env.USER_SERVICE_URL!));

// Protected routes
app.use(
  "/api/v1/users",
  rl, requireAuth,
  proxy(process.env.USER_SERVICE_URL!)
);

app.use(
  "/api/v1/orders",
  rl, requireAuth,
  // Apply idempotency check ONLY to POST (order creation)
  (req, res, next) => req.method === "POST" ? idempotencyCheck(req, res, next) : next(),
  proxy(process.env.ORDER_SERVICE_URL!)
);

app.use(
  "/api/v1/inventory",
  rl,
  proxy(process.env.INVENTORY_SERVICE_URL!)
);

// Razorpay webhooks — no auth (Razorpay signs the payload itself)
// The Order Service verifies the HMAC signature internally
app.use(
  "/api/v1/webhooks/razorpay",
  proxy(process.env.ORDER_SERVICE_URL!)
);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = parseInt(process.env.PORT || "3000");
app.listen(PORT, () => logger.info(`API Gateway running on :${PORT}`));
