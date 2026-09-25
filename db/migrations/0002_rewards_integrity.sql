-- LaosTravel migration 0002: coupon and points ledger integrity.
-- Idempotent against the desired-state reference schema.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.coupon_usages') IS NULL OR to_regclass('public.points_ledger') IS NULL THEN
  RAISE EXCEPTION 'LaosTravel rewards prerequisites are missing';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='coupon_usages_benefit_nonnegative' AND conrelid='coupon_usages'::regclass) THEN
  ALTER TABLE coupon_usages ADD CONSTRAINT coupon_usages_benefit_nonnegative CHECK (benefit_amount >= 0);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='points_ledger_type_check' AND conrelid='points_ledger'::regclass) THEN
  ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_type_check CHECK (type IN ('EARN','REDEEM','REVERSAL','EXPIRE','ADJUSTMENT'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='points_ledger_points_positive' AND conrelid='points_ledger'::regclass) THEN
  ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_points_positive CHECK (points > 0);
 END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_booking_redeem ON points_ledger(user_id,booking_id) WHERE booking_id IS NOT NULL AND type='REDEEM';
INSERT INTO schema_migrations(version) VALUES ('0002_rewards_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
