-- Core schema for Shopee CashBack Affiliate App
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'RETURNED'
);

CREATE TYPE earning_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'VOIDED'
);

CREATE TYPE wallet_txn_type AS ENUM (
  'EARNING_CONFIRMED',
  'EARNING_VOIDED',
  'WITHDRAWAL_REQUEST',
  'ADJUSTMENT'
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopee_item_id       BIGINT NOT NULL,
  shopee_shop_id       BIGINT NOT NULL,
  name                VARCHAR(500) NOT NULL,
  image_url           TEXT,
  price_min           NUMERIC(12,2),
  price_max           NUMERIC(12,2),
  commission_rate     NUMERIC(5,4),
  product_url         TEXT NOT NULL,
  raw_payload         JSONB,
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shopee_shop_id, shopee_item_id)
);

CREATE TABLE affiliate_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id),
  shopee_item_id    BIGINT NOT NULL,
  shopee_shop_id    BIGINT NOT NULL,
  sub_id            VARCHAR(100) NOT NULL UNIQUE,
  short_link        TEXT NOT NULL,
  original_url      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_item UNIQUE (user_id, shopee_item_id)
);

CREATE INDEX idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_sub_id ON affiliate_links(sub_id);

CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id     UUID NOT NULL REFERENCES affiliate_links(id),
  user_id               UUID NOT NULL REFERENCES users(id),
  shopee_order_id       VARCHAR(100) NOT NULL,
  shopee_order_item_id  VARCHAR(100),
  sub_id                VARCHAR(100) NOT NULL,
  status                order_status NOT NULL DEFAULT 'PENDING',
  order_amount          NUMERIC(12,2),
  commission_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency              VARCHAR(10) NOT NULL DEFAULT 'PHP',
  order_time            TIMESTAMPTZ,
  status_updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload           JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shopee_order_id, shopee_order_item_id)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_sub_id ON orders(sub_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE earnings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL UNIQUE REFERENCES orders(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  amount            NUMERIC(12,2) NOT NULL,
  status            earning_status NOT NULL DEFAULT 'PENDING',
  confirmed_at      TIMESTAMPTZ,
  voided_at         TIMESTAMPTZ,
  void_reason       VARCHAR(50),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_user_id_status ON earnings(user_id, status);

CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  earning_id      UUID REFERENCES earnings(id),
  type            wallet_txn_type NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  balance_after   NUMERIC(12,2) NOT NULL,
  description     VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_txn_user_id ON wallet_transactions(user_id);

CREATE TABLE withdrawal_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  amount        NUMERIC(12,2) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'NOT_IMPLEMENTED',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_checkpoints (
  job_name      VARCHAR(100) PRIMARY KEY,
  last_run_at   TIMESTAMPTZ,
  cursor        TEXT
);

CREATE VIEW user_wallet_summary AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'PENDING'), 0)   AS pending_balance,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'CONFIRMED'), 0) AS confirmed_balance
FROM users u
LEFT JOIN earnings e ON e.user_id = u.id
GROUP BY u.id;
