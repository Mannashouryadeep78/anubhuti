-- ─────────────────────────────────────────────────────────────────────────────
-- INVENTORY SERVICE — Database schema
-- File: inventory-service/migrations/001_init.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  price_paise   BIGINT NOT NULL,               -- e.g. 49900 = ₹499.00
  images        TEXT[] NOT NULL DEFAULT '{}',
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SKU = Stock Keeping Unit (one product can have multiple SKUs for variants)
CREATE TABLE IF NOT EXISTS inventory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  sku_id          TEXT UNIQUE NOT NULL,         -- e.g. "SAREE-RED-L"
  variant_attrs   JSONB DEFAULT '{}',           -- {color: "red", size: "L"}
  total_stock     INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock  INTEGER NOT NULL DEFAULT 0,  -- soft-held in Redis
  sold_count      INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER NOT NULL DEFAULT 10,  -- alert when stock hits this
  active          BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_non_negative CHECK (available_stock >= 0),
  CONSTRAINT reserved_non_negative CHECK (reserved_stock >= 0)
);

-- Stock change audit log (for reconciliation after Redis inconsistencies)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id              BIGSERIAL PRIMARY KEY,
  sku_id          TEXT NOT NULL,
  change_amount   INTEGER NOT NULL,             -- positive = restock, negative = sale
  change_type     TEXT NOT NULL CHECK (change_type IN
                    ('RESTOCK', 'SALE', 'RESERVATION', 'RELEASE', 'ADJUSTMENT')),
  reference_id    TEXT,                         -- order ID or restock batch ID
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_product  ON inventory(product_id);
CREATE INDEX idx_inventory_sku      ON inventory(sku_id);
CREATE INDEX idx_inventory_active   ON inventory(active) WHERE active = true;
CREATE INDEX idx_stock_ledger_sku   ON stock_ledger(sku_id, occurred_at DESC);
CREATE INDEX idx_products_category  ON products(category) WHERE active = true;

-- GIN index for tag-based filtering
CREATE INDEX idx_products_tags ON products USING GIN(tags);
