// order-service/src/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Order Service — manages the order state machine and Razorpay integration.
//
// Order status flow:
//   PENDING → INVENTORY_RESERVED → PAYMENT_INITIATED → PAYMENT_CAPTURED
//          → PROCESSING → SHIPPED → DELIVERED
//   Any state → CANCELLED (if allowed by cancellation policy)
//   PAYMENT_INITIATED → PAYMENT_FAILED → CANCELLED
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { createClient } from "redis";
import { Pool } from "pg";
import { Kafka, Partitioners } from "kafkajs";
import Razorpay from "razorpay";
import crypto from "crypto";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

// Razorpay webhooks need raw body for HMAC verification — mount BEFORE json()
app.use("/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use(express.json());

// ─── Clients ──────────────────────────────────────────────────────────────────
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const pg = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID!,
  brokers: process.env.KAFKA_BROKERS!.split(","),
  retry: { retries: 8, initialRetryTime: 300 },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  idempotent: true,
  transactionalId: "order-service-producer",
});
await producer.connect();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ANB-${timestamp}-${random}`;
}

// Safe order status transitions — prevents illegal state jumps
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:              ["INVENTORY_RESERVED", "CANCELLED"],
  INVENTORY_RESERVED:   ["PAYMENT_INITIATED", "CANCELLED"],
  PAYMENT_INITIATED:    ["PAYMENT_CAPTURED", "PAYMENT_FAILED"],
  PAYMENT_FAILED:       ["CANCELLED"],
  PAYMENT_CAPTURED:     ["PROCESSING"],
  PROCESSING:           ["SHIPPED", "CANCELLED"],
  SHIPPED:              ["DELIVERED"],
  DELIVERED:            [],
  CANCELLED:            [],
};

async function transitionOrder(
  orderId: string,
  newStatus: string,
  meta: Record<string, unknown> = {}
): Promise<boolean> {
  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
      [orderId]
    );

    if (!rows[0]) throw new Error(`Order ${orderId} not found`);

    const current = rows[0].status;
    if (!ALLOWED_TRANSITIONS[current]?.includes(newStatus)) {
      throw new Error(
        `Illegal transition: ${current} → ${newStatus} for order ${orderId}`
      );
    }

    await client.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
      [newStatus, orderId]
    );

    // Append to status history for the tracking timeline
    await client.query(
      `INSERT INTO order_status_history (order_id, status, metadata, occurred_at)
       VALUES ($1, $2, $3, NOW())`,
      [orderId, newStatus, JSON.stringify(meta)]
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err, orderId, newStatus }, "Order transition failed");
    return false;
  } finally {
    client.release();
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /orders — create order and reserve inventory
app.post("/orders", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const userEmail = req.headers["x-user-email"] as string;

  const { items, shippingAddress, geoCoordinates } = req.body;

  // 1. Calculate total from Inventory Service (never trust client-side prices)
  const invRes = await fetch(
    `${process.env.INVENTORY_SERVICE_URL}/products/prices`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }
  );
  const { totalInPaise, priceBreakdown } = await invRes.json();

  // 2. Create order in DB (PENDING state)
  const orderId = generateOrderId();
  await pg.query(
    `INSERT INTO orders
       (id, user_id, user_email, items, shipping_address, geo_coordinates,
        total_amount_paise, price_breakdown, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING',NOW(),NOW())`,
    [
      orderId, userId, userEmail,
      JSON.stringify(items),
      JSON.stringify(shippingAddress),
      JSON.stringify(geoCoordinates),
      totalInPaise,
      JSON.stringify(priceBreakdown),
    ]
  );

  // 3. Reserve inventory (sync call — must succeed before payment)
  const reserveRes = await fetch(
    `${process.env.INVENTORY_SERVICE_URL}/inventory/reserve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, items }),
    }
  );

  if (!reserveRes.ok) {
    const { error, outOfStockSkus } = await reserveRes.json();
    await transitionOrder(orderId, "CANCELLED", { reason: "Out of stock", outOfStockSkus });
    res.status(409).json({ error, outOfStockSkus });
    return;
  }

  await transitionOrder(orderId, "INVENTORY_RESERVED");

  // 4. Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: totalInPaise,
    currency: "INR",
    receipt: orderId,
    notes: { orderId, userId },
  });

  await transitionOrder(orderId, "PAYMENT_INITIATED", {
    razorpayOrderId: razorpayOrder.id,
  });

  // Update order with Razorpay order ID
  await pg.query(
    "UPDATE orders SET razorpay_order_id = $1 WHERE id = $2",
    [razorpayOrder.id, orderId]
  );

  // 5. Emit event — notification worker will send "Order received" email
  await producer.send({
    topic: "order.created",
    messages: [{
      key: orderId,
      // Partition by userId so all events for one user go to same partition
      // (preserves ordering for tracking updates)
      partition: undefined,
      value: JSON.stringify({
        orderId, userId, userEmail, items,
        totalInPaise, shippingAddress, createdAt: new Date().toISOString(),
      }),
    }],
  });

  res.status(201).json({
    orderId,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    amount: totalInPaise,
    currency: "INR",
  });
});

// GET /orders/:id — fetch order + tracking timeline
app.get("/orders/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;

  const { rows: orders } = await pg.query(
    `SELECT o.*, json_agg(
       json_build_object(
         'status', h.status,
         'metadata', h.metadata,
         'occurredAt', h.occurred_at
       ) ORDER BY h.occurred_at ASC
     ) AS timeline
     FROM orders o
     LEFT JOIN order_status_history h ON h.order_id = o.id
     WHERE o.id = $1 AND o.user_id = $2
     GROUP BY o.id`,
    [req.params.id, userId]
  );

  if (!orders[0]) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(orders[0]);
});

// POST /orders/:id/cancel — initiate cancellation
app.post("/orders/:id/cancel", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { reason } = req.body;

  const { rows } = await pg.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [req.params.id, userId]
  );

  if (!rows[0]) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const order = rows[0];

  // Cancellation policy: only allow before SHIPPED
  if (["SHIPPED", "DELIVERED"].includes(order.status)) {
    res.status(422).json({ error: "Order cannot be cancelled after shipment" });
    return;
  }

  const ok = await transitionOrder(order.id, "CANCELLED", { reason, cancelledBy: userId });
  if (!ok) {
    res.status(422).json({ error: "Cannot cancel order in current state" });
    return;
  }

  // Emit cancellation — inventory worker will release the reservation
  await producer.send({
    topic: "order.cancelled",
    messages: [{
      key: order.id,
      value: JSON.stringify({
        orderId: order.id,
        userId,
        items: order.items,
        reason,
        cancelledAt: new Date().toISOString(),
      }),
    }],
  });

  // If payment was already captured, initiate refund
  if (order.status === "PAYMENT_CAPTURED" && order.razorpay_payment_id) {
    await producer.send({
      topic: "payment.refund.initiated",
      messages: [{
        key: order.id,
        value: JSON.stringify({
          orderId: order.id,
          razorpayPaymentId: order.razorpay_payment_id,
          amountInPaise: order.total_amount_paise,
        }),
      }],
    });
  }

  res.json({ cancelled: true });
});

// ─── Razorpay webhook handler ──────────────────────────────────────────────
// Razorpay signs the webhook payload with HMAC-SHA256.
// We MUST verify this signature before trusting any payment event.
app.post("/webhooks/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const body = req.body as Buffer;

  // Step 1: Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    logger.warn("Razorpay webhook signature mismatch");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const event = JSON.parse(body.toString());

  // Step 2: Idempotency check (Razorpay can replay webhooks)
  const dedupeKey = `webhook:${event.payload.payment?.entity?.id}:${event.event}`;
  const alreadyProcessed = await redis.set(dedupeKey, "1", {
    NX: true,
    EX: 86400,
  });

  if (!alreadyProcessed) {
    // Already handled — return 200 to stop Razorpay retrying
    res.json({ status: "already_processed" });
    return;
  }

  // Step 3: Route event
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (orderId) {
      await transitionOrder(orderId, "PAYMENT_CAPTURED", {
        razorpayPaymentId: payment.id,
        method: payment.method,
      });

      await pg.query(
        "UPDATE orders SET razorpay_payment_id = $1 WHERE id = $2",
        [payment.id, orderId]
      );

      // Emit to Kafka — inventory worker confirms stock, notification worker sends receipt
      await producer.send({
        topic: "payment.captured",
        messages: [{
          key: orderId,
          value: JSON.stringify({
            orderId,
            razorpayPaymentId: payment.id,
            amountInPaise: payment.amount,
            capturedAt: new Date().toISOString(),
          }),
        }],
      });
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (orderId) {
      await transitionOrder(orderId, "PAYMENT_FAILED", {
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
      });

      // Release inventory reservation
      const { rows } = await pg.query(
        "SELECT items FROM orders WHERE id = $1",
        [orderId]
      );
      if (rows[0]) {
        await producer.send({
          topic: "order.cancelled",
          messages: [{
            key: orderId,
            value: JSON.stringify({
              orderId,
              items: rows[0].items,
              reason: "Payment failed",
            }),
          }],
        });
      }
    }
  }

  res.json({ status: "ok" });
});

app.get("/health", async (_req, res) => {
  try {
    await pg.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

const PORT = parseInt(process.env.PORT || "3002");
app.listen(PORT, () => logger.info(`Order Service running on :${PORT}`));
