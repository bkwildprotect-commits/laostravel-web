-- 0025: server-owned completion reward idempotency.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_booking_earn ON points_ledger(user_id,booking_id) WHERE booking_id IS NOT NULL AND type='EARN';
INSERT INTO schema_migrations(version) VALUES ('0025_completion_reward_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;