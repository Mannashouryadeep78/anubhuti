-- ─────────────────────────────────────────────────────────────────────────────
-- ORDER SERVICE — Database schema
-- File: order-service/migrations/001_init.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'INVENTORY_RESERVED',
  'PAYMENT_INITIATED',
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY,           -- ANB-xxxxxxxx-xxxx
  user_id               UUID NOT NULL,
  user_email            TEXT NOT NULL,
  items                 JSONB NOT NULL,             -- [{skuId, qty, priceAtOrder}]
  shipping_address      JSONB NOT NULL,
  geo_coordinates       JSONB,                      -- {lat, lng} from Leaflet
  total_amount_paise    BIGINT NOT NULL,            -- always store money as integer paise
  price_breakdown       JSONB,
  status                order_status NOT NULL DEFAULT 'PENDING',
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  tracking_id           TEXT,
  courier               TEXT,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only status audit trail — powers your Framer Motion tracking timeline
CREATE TABLE IF NOT EXISTS order_status_history (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id),
  status      order_status NOT NULL,
  metadata    JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user_id   ON orders(user_id);
CREATE INDEX idx_orders_status    ON orders(status);
CREATE INDEX idx_orders_created   ON orders(created_at DESC);
CREATE INDEX idx_orders_rzp_order ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_history_order_id ON order_status_history(order_id);
-- Partial index for active orders (not delivered/cancelled) — fast dashboard queries
CREATE INDEX idx_orders_active    ON orders(user_id, created_at DESC)
  WHERE status NOT IN ('DELIVERED', 'CANCELLED');
