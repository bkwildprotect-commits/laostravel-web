-- 0021: authoritative Partner price offers for server quotes.
BEGIN;
CREATE TABLE IF NOT EXISTS service_price_offers (
 id uuid PRIMARY KEY,
 service_id uuid NOT NULL REFERENCES services(id),
 option_id text,
 currency char(3) NOT NULL CHECK(currency='LAK'),
 unit_amount bigint NOT NULL CHECK(unit_amount>=0),
 partner_discount_amount bigint NOT NULL DEFAULT 0 CHECK(partner_discount_amount>=0 AND partner_discount_amount<=unit_amount),
 status text NOT NULL CHECK(status IN ('DRAFT','ACTIVE','RETIRED')),
 effective_from timestamptz NOT NULL,
 effective_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(effective_until IS NULL OR effective_until>effective_from)
);
CREATE INDEX IF NOT EXISTS idx_service_price_offer_active ON service_price_offers(service_id,status,effective_from);
INSERT INTO schema_migrations(version) VALUES ('0021_service_price_offers') ON CONFLICT(version) DO NOTHING;
COMMIT;
