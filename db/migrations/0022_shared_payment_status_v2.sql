-- 0022: align booking payment truth with the shared Web/Mobile contract.
BEGIN;
UPDATE bookings SET payment_status='UNPAID' WHERE payment_status IN ('PENDING','REQUESTED','AUTHORIZED');
UPDATE bookings SET payment_status='UNPAID' WHERE payment_status IN ('FAILED','CANCELLED');
ALTER TABLE bookings ALTER COLUMN payment_status SET DEFAULT 'UNPAID';
INSERT INTO schema_migrations(version) VALUES ('0022_shared_payment_status_v2') ON CONFLICT(version) DO NOTHING;
COMMIT;
