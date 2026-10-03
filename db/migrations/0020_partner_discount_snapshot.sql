-- 0020: distinguish Partner-funded discounts from LaosTravel coupons.
BEGIN;
ALTER TABLE price_quotes ADD COLUMN IF NOT EXISTS partner_discount_amount bigint NOT NULL DEFAULT 0 CHECK(partner_discount_amount>=0);
ALTER TABLE price_snapshots ADD COLUMN IF NOT EXISTS partner_discount_amount bigint NOT NULL DEFAULT 0 CHECK(partner_discount_amount>=0);
ALTER TABLE price_quotes DROP CONSTRAINT IF EXISTS price_quotes_check;
ALTER TABLE price_quotes ADD CONSTRAINT price_quotes_total_components_check CHECK(customer_total=base_amount+fees_amount-partner_discount_amount-coupon_amount-points_benefit_amount);
INSERT INTO schema_migrations(version) VALUES ('0020_partner_discount_snapshot') ON CONFLICT(version) DO NOTHING;
COMMIT;
