-- LaosTravel migration 0002: coupon and points ledger integrity.
-- This migration has not been applied to production and is safe to revise before first deployment.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.coupon_usages') IS NULL OR to_regclass('public.points_ledger') IS NULL THEN
  RAISE EXCEPTION 'LaosTravel rewards prerequisites are missing';
 END IF;
END $$;

ALTER TABLE coupon_usages ADD CONSTRAINT coupon_usages_benefit_nonnegative CHECK (benefit_amount >= 0);
-- Do not enforce UNIQUE(user_id,coupon_id): coupon reuse/loop policy is intentionally unresolved.
-- booking_id is already UNIQUE, so a booking cannot claim multiple coupon usages.

ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_type_check CHECK (type IN ('EARN','REDEEM','REVERSAL','EXPIRE','ADJUSTMENT'));
ALTER TABLE points_ledger ADD CONSTRAINT points_ledger_points_positive CHECK (points > 0);
-- Prevent duplicate redemption for one booking without blocking legitimate reversal/adjustment history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_booking_redeem
 ON points_ledger(user_id,booking_id)
 WHERE booking_id IS NOT NULL AND type='REDEEM';

INSERT INTO schema_migrations(version) VALUES ('0002_rewards_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
