-- 0007: one successful booking per authoritative quote
BEGIN;
ALTER TABLE price_quotes ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
ALTER TABLE price_quotes ADD COLUMN IF NOT EXISTS consumed_booking_id uuid REFERENCES bookings(id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_quotes_consumed_booking ON price_quotes(consumed_booking_id) WHERE consumed_booking_id IS NOT NULL;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='price_quotes_consumption_pair') THEN ALTER TABLE price_quotes ADD CONSTRAINT price_quotes_consumption_pair CHECK ((consumed_at IS NULL)=(consumed_booking_id IS NULL)); END IF; END $$;
INSERT INTO schema_migrations(version) VALUES ('0007_quote_consumption') ON CONFLICT(version) DO NOTHING;
COMMIT;
