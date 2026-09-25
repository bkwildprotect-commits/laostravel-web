-- LaosTravel migration 0002: coupon and points ledger integrity.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.coupon_usages') IS NULL OR to_regclass('public.points_ledger') IS NULL THEN
  RAISE EXCEPTION 'LaosTravel rewards prerequisites are missing';
 END IF;
END $$;
ALTER TABLE coupon_usages ADD CONSTRAINT coupon_usages_benefit_nonnegative CHECK (benefit_amount >= 0);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupon_usage_user_coupon ON coupon_usages(user_id,coupon_id);
ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_type_check CHECK (type IN ('EARN','REDEEM','REVERSAL','EXPIRE','ADJUSTMENT'));
ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_points_positive CHECK (points > 0);
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_booking_type ON points_ledger(user_id,booking_id,type) WHERE booking_id IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES ('0002_rewards_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
