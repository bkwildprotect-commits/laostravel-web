-- 0016: align booking lifecycle terminology and add operational stages.
BEGIN;
UPDATE bookings SET status='REQUESTED' WHERE status='PENDING';
INSERT INTO schema_migrations(version) VALUES ('0016_booking_lifecycle_v2') ON CONFLICT(version) DO NOTHING;
COMMIT;
