-- 0005: authoritative server price quotes
BEGIN;
CREATE TABLE IF NOT EXISTS price_quotes (
 id uuid PRIMARY KEY,
 service_id uuid NOT NULL REFERENCES services(id),
 availability_id uuid NOT NULL REFERENCES availability(id),
 option_id text,
 service_date date NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0),
 availability_token text NOT NULL UNIQUE,
 currency char(3) NOT NULL,
 base_amount bigint NOT NULL CHECK(base_amount>=0),
 fees_amount bigint NOT NULL DEFAULT 0 CHECK(fees_amount>=0),
 coupon_amount bigint NOT NULL DEFAULT 0 CHECK(coupon_amount>=0),
 points_benefit_amount bigint NOT NULL DEFAULT 0 CHECK(points_benefit_amount>=0),
 customer_total bigint NOT NULL CHECK(customer_total>=0),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(customer_total=base_amount+fees_amount-coupon_amount-points_benefit_amount)
);
CREATE INDEX IF NOT EXISTS idx_price_quotes_expiry ON price_quotes(expires_at);
INSERT INTO schema_migrations(version) VALUES ('0005_price_quotes') ON CONFLICT(version) DO NOTHING;
COMMIT;
