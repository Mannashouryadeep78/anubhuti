export interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
  detail: {
    title: string;
    description: string;
    endpoints?: { method: string; path: string; desc: string }[];
    code?: { lang: string; snippet: string };
    bullets?: string[];
  };
}

export const nodes: ArchNode[] = [
  {
    id: 'frontend',
    label: 'React Frontend',
    sublabel: 'Vite · React 19 · Framer Motion',
    color: '#C5A059',
    icon: '⬡',
    detail: {
      title: 'React Frontend',
      description: 'The current Anubhuti SPA. Handles all rendering, routing, and user interaction. In the target architecture, localStorage auth is replaced by JWT headers, and the fake checkout phases are replaced by the Razorpay SDK.',
      bullets: [
        'Swap anubhuti_access localStorage flag → Authorization: Bearer <JWT> header on every API call',
        'Replace 5-phase fake checkout → Razorpay SDK modal (rzp.open())',
        'Replace localStorage orders → live GET /orders/:id polling or WebSocket updates',
        'CartContext persists to Inventory Service reservations, not just local state',
      ],
      code: {
        lang: 'javascript',
        snippet: `// Replace fake OTP verify with real JWT
const { token } = await fetch('/api/v1/auth/verify-passcode', {
  method: 'POST',
  body: JSON.stringify({ code: passcode, email })
}).then(r => r.json());

// Store JWT (httpOnly cookie preferred in production)
localStorage.setItem('jwt', token);`,
      },
    },
  },
  {
    id: 'gateway',
    label: 'API Gateway',
    sublabel: 'JWT Validation · Rate Limiting · Routing',
    color: '#7C6FA0',
    icon: '⬢',
    detail: {
      title: 'API Gateway',
      description: 'The single entry point for all API traffic. It validates JWTs, enforces rate limits, and proxies requests to the correct downstream microservice. Start with a simple Express proxy or drop in Kong on Docker.',
      bullets: [
        'Validates JWT signature on every request — services never see unauthenticated traffic',
        'Rate limiting per user ID prevents abuse during flash sales',
        'Routes /api/v1/users/* → User Service, /api/v1/inventory/* → Inventory Service, etc.',
        'Returns 401 immediately if JWT is expired or blacklisted in Redis',
      ],
      code: {
        lang: 'javascript',
        snippet: `// Minimal Express API Gateway
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // Check Redis blacklist for logged-out tokens
    const blacklisted = await redis.get(\`blacklist:\${token}\`);
    if (blacklisted) return res.status(401).json({ error: 'Token revoked' });
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});`,
      },
    },
  },
  {
    id: 'user-service',
    label: 'User Service',
    sublabel: '/api/v1/users · Supabase · Redis',
    color: '#4A90D9',
    icon: '◈',
    detail: {
      title: 'User Service',
      description: 'Replaces ProtectedRoute.tsx + Supabase localStorage logic with a proper auth server. Supabase remains the DB for access_codes. Redis stores a token blacklist for instant logout.',
      endpoints: [
        { method: 'POST', path: '/auth/verify-passcode', desc: 'Validate code against Supabase, return signed JWT' },
        { method: 'POST', path: '/auth/refresh', desc: 'Rotate JWT using a refresh token' },
        { method: 'POST', path: '/auth/logout', desc: 'Add current JWT to Redis blacklist' },
        { method: 'GET', path: '/users/:id', desc: 'Fetch user profile and access tier' },
      ],
      code: {
        lang: 'javascript',
        snippet: `// verify-passcode endpoint
const { data } = await supabase
  .from('access_codes')
  .select('*')
  .eq('code', passcode)
  .gt('expires_at', new Date().toISOString())
  .limit(1);

if (!data?.length) return res.status(401).json({ error: 'Invalid passcode' });

const token = jwt.sign(
  { userId: data[0].id, email: data[0].email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
res.json({ token });`,
      },
    },
  },
  {
    id: 'inventory-service',
    label: 'Inventory Service',
    sublabel: '/api/v1/inventory · Redis · PostgreSQL',
    color: '#50C878',
    icon: '◉',
    detail: {
      title: 'Inventory Service',
      description: 'The most critical service for scale. The core danger at high traffic is overselling — two users buying the last unit simultaneously. Redis atomic DECR operations solve this.',
      endpoints: [
        { method: 'GET', path: '/products', desc: 'List products with stock (Redis cache, 30s TTL)' },
        { method: 'POST', path: '/inventory/reserve', desc: 'Soft-reserve stock for 10 min (atomic DECR in Redis)' },
        { method: 'POST', path: '/inventory/confirm', desc: 'Permanently deduct stock on payment success' },
        { method: 'POST', path: '/inventory/release', desc: 'Release reservation on cancellation or timeout' },
      ],
      code: {
        lang: 'javascript',
        snippet: `// Race-condition-safe stock reservation
// Redis DECR is atomic — no two users can decrement simultaneously
const remaining = await redis.decr(\`stock:\${productId}\`);

if (remaining < 0) {
  // Undo the decrement — item is sold out
  await redis.incr(\`stock:\${productId}\`);
  return res.status(409).json({ error: 'Out of stock' });
}

// Set reservation expiry (10 min hold)
await redis.setex(\`reservation:\${orderId}:\${productId}\`, 600, '1');
// Emit event for Order Service to consume
kafka.emit('inventory.reserved', { orderId, productId });`,
      },
    },
  },
  {
    id: 'order-service',
    label: 'Order Service',
    sublabel: '/api/v1/orders · PostgreSQL · Kafka',
    color: '#E87040',
    icon: '◆',
    detail: {
      title: 'Order Service',
      description: 'Replaces the 5-phase browser state machine. Manages an orders table with explicit status transitions and publishes Kafka events so downstream services react asynchronously.',
      endpoints: [
        { method: 'POST', path: '/orders', desc: 'Create order, emit order.created to Kafka → 202 Accepted' },
        { method: 'GET', path: '/orders/:id', desc: 'Fetch order with full status timeline' },
        { method: 'PATCH', path: '/orders/:id/status', desc: 'Internal status update from Kafka consumer' },
        { method: 'POST', path: '/orders/:id/cancel', desc: 'Emit order.cancelled to Kafka' },
      ],
      bullets: [
        'Status machine: PENDING → PAYMENT_INITIATED → PAYMENT_CAPTURED → PROCESSING → SHIPPED → DELIVERED',
        'Returns 202 Accepted immediately — never blocks on payment confirmation',
        'PostgreSQL is source of truth; all status history is append-only',
      ],
    },
  },
  {
    id: 'kafka',
    label: 'Kafka',
    sublabel: 'Event Backbone · 4 Core Topics',
    color: '#E8B840',
    icon: '⟨⟩',
    detail: {
      title: 'Kafka Message Backbone',
      description: 'The nervous system of the architecture. Services communicate via fire-and-forget events instead of blocking HTTP calls. This is how you handle a flash sale with 50,000 simultaneous orders.',
      bullets: [
        'order.created → consumed by Inventory Worker (reserve stock) + Notification Worker (send email)',
        'payment.captured → emitted by Razorpay Webhook handler, consumed by Order Service + Inventory Worker',
        'inventory.reserved → emitted by Inventory Service, consumed by Order Service (advance status)',
        'order.cancelled → consumed by Inventory Worker (release stock) + Notification Worker (send refund email)',
        'Each topic has a consumer group — if a worker crashes, Kafka redelivers the message automatically',
      ],
      code: {
        lang: 'javascript',
        snippet: `// Order Service: publish event and return immediately
app.post('/orders', async (req, res) => {
  const order = await db.orders.create({ ...req.body, status: 'PENDING' });

  // Fire-and-forget — don't await Kafka
  kafka.emit('order.created', {
    orderId: order.id,
    items: order.items,
    userId: req.user.userId,
  });

  // Return 202 immediately — frontend polls for status updates
  res.status(202).json({ orderId: order.id, status: 'PENDING' });
});`,
      },
    },
  },
  {
    id: 'razorpay',
    label: 'Razorpay',
    sublabel: 'Payment Gateway · Webhook Verified',
    color: '#3DB8E8',
    icon: '₹',
    detail: {
      title: 'Razorpay Integration',
      description: 'Replaces the simulated Amex fraud terminal with a real, production-grade Indian payment gateway. The 3-step flow ensures payments are always server-verified via HMAC signature.',
      bullets: [
        'Step 1 — Backend creates a Razorpay order and returns the order ID to frontend',
        'Step 2 — Frontend opens the Razorpay modal using the order ID',
        'Step 3 — Razorpay sends a webhook to your backend; HMAC signature is verified before confirming payment',
        'NEVER trust the frontend for payment confirmation — always verify the webhook signature',
      ],
      code: {
        lang: 'javascript',
        snippet: `// Step 3: Verify Razorpay webhook (Order Service)
app.post('/webhooks/razorpay', (req, res) => {
  const isValid = validateWebhookSignature(
    JSON.stringify(req.body),
    req.headers['x-razorpay-signature'],
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

  const { order_id, payment_id } = req.body.payload.payment.entity;

  // Emit to Kafka — Order and Inventory services react
  kafka.emit('payment.captured', { orderId: order_id, paymentId: payment_id });
  res.json({ received: true });
});`,
      },
    },
  },
  {
    id: 'redis',
    label: 'Redis',
    sublabel: 'Token Blacklist · Stock Cache · Sessions',
    color: '#D94040',
    icon: '⬟',
    detail: {
      title: 'Redis — The Speed Layer',
      description: 'Redis serves three critical roles: JWT blacklisting for instant logout, atomic stock counters for race-condition-safe inventory, and product catalog caching to reduce PostgreSQL load.',
      bullets: [
        'Token blacklist: SET blacklist:<token> 1 EX 604800 — checked by API Gateway on every request',
        'Stock counters: DECR stock:<productId> — atomic, no two users can oversell',
        'Product cache: GET/SET products:all with 30s TTL — absorbs read traffic during flash sales',
        'Reservation TTL: SETEX reservation:<orderId>:<productId> 600 — auto-releases in 10 min if payment fails',
      ],
    },
  },
];

export const kafkaTopics = [
  { topic: 'order.created', producer: 'Order Service', consumers: 'Inventory Worker, Notification Worker' },
  { topic: 'payment.captured', producer: 'Razorpay Webhook', consumers: 'Order Service, Inventory Worker' },
  { topic: 'inventory.reserved', producer: 'Inventory Worker', consumers: 'Order Service' },
  { topic: 'order.cancelled', producer: 'Order Service', consumers: 'Inventory Worker, Notification Worker' },
];

export const buildOrder = [
  { step: 1, title: 'Scaffold 3 Node.js + Express repos', desc: 'One per service. Each gets its own package.json, Dockerfile, and DB connection.' },
  { step: 2, title: 'Set up API Gateway', desc: 'Simple Express proxy or Kong on Docker. JWT validation + routing only.' },
  { step: 3, title: 'Add Kafka locally', desc: 'docker-compose with Confluent cp-kafka image. Create your 4 topics manually.' },
  { step: 4, title: 'Migrate User Service', desc: 'Port Supabase access code logic from ProtectedRoute.tsx. Smallest change.' },
  { step: 5, title: 'Build Inventory Service', desc: 'Set up Redis atomic counters before touching order logic.' },
  { step: 6, title: 'Build Order Service + Razorpay', desc: 'Wire up Razorpay order creation and webhook. Hook Kafka events to workers.' },
  { step: 7, title: 'Update React Frontend', desc: 'Swap localStorage auth for JWT headers. Replace fake checkout with Razorpay SDK.' },
];
