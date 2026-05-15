// inventory-service/src/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Inventory Service — the hardest service to get right at scale.
//
// The central challenge: at 1M users, two people CAN hit the "last item"
// simultaneously. We solve this with Redis atomic DECR + Lua scripts.
//
// Stock lifecycle per SKU:
//   total_stock (Postgres, source of truth)
//   available   = total_stock - reserved - sold  (Redis int, fast reads)
//   reserved    = soft-hold during checkout       (Redis hash, TTL 10min)
//   sold        = confirmed purchases             (Postgres, append-only)
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { createClient } from "redis";
import { Pool } from "pg";
import { Kafka, Partitioners } from "kafkajs";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();
app.use(express.json());

// ─── Redis ────────────────────────────────────────────────────────────────────
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// ─── Postgres ─────────────────────────────────────────────────────────────────
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

// ─── Kafka producer ───────────────────────────────────────────────────────────
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID!,
  brokers: process.env.KAFKA_BROKERS!.split(","),
  retry: { retries: 8, initialRetryTime: 300 },
});
const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  // Idempotent producer: exactly-once delivery guarantee
  idempotent: true,
  transactionalId: "inventory-service-producer",
});
await producer.connect();

// ─── Lua script for atomic reserve ───────────────────────────────────────────
// This runs atomically on the Redis server — no race condition possible.
// It checks available stock, decrements it, and sets a reservation TTL
// all in a single operation. If stock is 0, it returns -1 (fail).
const RESERVE_SCRIPT = `
local stock_key = KEYS[1]
local reservation_key = KEYS[2]
local order_id = ARGV[1]
local qty = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

local available = tonumber(redis.call('GET', stock_key) or '0')

if available < qty then
  return -1
end

-- Atomically decrement available stock
redis.call('DECRBY', stock_key, qty)

-- Record this reservation (orderId → qty), with expiry
redis.call('HSET', reservation_key, order_id, qty)
redis.call('EXPIRE', reservation_key, ttl)

return available - qty
`;

// ─── Stock initialisation ─────────────────────────────────────────────────────
// On startup, load all product stock counts from Postgres into Redis.
// This warms the cache. In production, run this as a separate init job.
async function warmStockCache() {
  const { rows } = await pg.query(
    "SELECT sku_id, available_stock FROM inventory WHERE active = true"
  );
  const pipe = redis.multi();
  for (const row of rows) {
    pipe.set(`stock:${row.sku_id}`, row.available_stock, { NX: true });
  }
  await pipe.exec();
  logger.info({ count: rows.length }, "Stock cache warmed");
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /products — list with live stock counts from Redis cache
app.get("/products", async (_req, res) => {
  const { rows } = await pg.query(`
    SELECT p.id, p.name, p.price, p.images, p.description,
           i.sku_id, i.total_stock, i.available_stock
    FROM products p
    JOIN inventory i ON p.id = i.product_id
    WHERE p.active = true
    ORDER BY p.created_at DESC
  `);

  // Overlay Redis counts for freshness
  const stockKeys = rows.map((r) => `stock:${r.sku_id}`);
  const liveCounts = stockKeys.length
    ? await redis.mGet(stockKeys)
    : [];

  const products = rows.map((row, i) => ({
    ...row,
    available_stock: liveCounts[i] !== null
      ? parseInt(liveCounts[i]!)
      : row.available_stock,
  }));

  res.json({ products });
});

// POST /inventory/reserve — soft-reserve stock during checkout
// Called by Order Service when user initiates payment.
app.post("/inventory/reserve", async (req, res) => {
  const { orderId, items } = req.body as {
    orderId: string;
    items: Array<{ skuId: string; qty: number }>;
  };

  const ttl = parseInt(process.env.RESERVATION_TTL || "600");
  const results: Record<string, number> = {};
  const failed: string[] = [];

  for (const item of items) {
    const stockKey = `stock:${item.skuId}`;
    const reserveKey = `reservations:${item.skuId}`;

    const remaining = await redis.eval(RESERVE_SCRIPT, {
      keys: [stockKey, reserveKey],
      arguments: [orderId, item.qty.toString(), ttl.toString()],
    }) as number;

    if (remaining === -1) {
      failed.push(item.skuId);
    } else {
      results[item.skuId] = remaining;
    }
  }

  if (failed.length > 0) {
    // Roll back any successful reservations from this request
    for (const skuId of Object.keys(results)) {
      const item = items.find((i) => i.skuId === skuId)!;
      await redis.incrBy(`stock:${skuId}`, item.qty);
      await redis.hDel(`reservations:${skuId}`, orderId);
    }

    // Emit failure event to Kafka so Order Service can cancel the order
    await producer.send({
      topic: "inventory.reserve.failed",
      messages: [{
        key: orderId,
        value: JSON.stringify({ orderId, failedSkus: failed }),
      }],
    });

    res.status(409).json({
      error: "Insufficient stock",
      outOfStockSkus: failed,
    });
    return;
  }

  // Emit success event — Order Service will proceed to payment
  await producer.send({
    topic: "inventory.reserved",
    messages: [{
      key: orderId,
      value: JSON.stringify({ orderId, items, reservedUntil: Date.now() + ttl * 1000 }),
    }],
  });

  res.json({ reserved: true, stockRemaining: results });
});

// POST /inventory/confirm — permanently deduct stock after payment success
// Called by Inventory Worker when it receives payment.captured from Kafka
app.post("/inventory/confirm", async (req, res) => {
  const { orderId, items } = req.body as {
    orderId: string;
    items: Array<{ skuId: string; qty: number }>;
  };

  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      // Deduct from Postgres (source of truth)
      await client.query(
        `UPDATE inventory
         SET available_stock = available_stock - $1,
             sold_count = sold_count + $1,
             updated_at = NOW()
         WHERE sku_id = $2 AND available_stock >= $1`,
        [item.qty, item.skuId]
      );

      // Clear the Redis reservation
      await redis.hDel(`reservations:${item.skuId}`, orderId);
    }

    await client.query("COMMIT");
    res.json({ confirmed: true });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err, orderId }, "Stock confirmation failed");
    res.status(500).json({ error: "Stock confirmation failed" });
  } finally {
    client.release();
  }
});

// POST /inventory/release — release reservation (cancel / timeout)
app.post("/inventory/release", async (req, res) => {
  const { orderId, items } = req.body as {
    orderId: string;
    items: Array<{ skuId: string; qty: number }>;
  };

  for (const item of items) {
    await redis.incrBy(`stock:${item.skuId}`, item.qty);
    await redis.hDel(`reservations:${item.skuId}`, orderId);
  }

  res.json({ released: true });
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await redis.ping();
    await pg.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

// ─── Kafka consumer (listens to order.cancelled, payment.captured) ──────────
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID! });
await consumer.connect();
await consumer.subscribe({
  topics: ["order.cancelled", "payment.captured"],
  fromBeginning: false,
});

await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const payload = JSON.parse(message.value!.toString());

    if (topic === "order.cancelled") {
      // Release held stock
      await Promise.all(
        payload.items.map((item: { skuId: string; qty: number }) =>
          redis.incrBy(`stock:${item.skuId}`, item.qty)
        )
      );
    }

    if (topic === "payment.captured") {
      // Confirm stock deduction
      const { orderId, items } = payload;
      await fetch(`http://localhost:${process.env.PORT}/inventory/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, items }),
      });
    }
  },
});

await warmStockCache();

const PORT = parseInt(process.env.PORT || "3003");
app.listen(PORT, () => logger.info(`Inventory Service running on :${PORT}`));
