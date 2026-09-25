-- 0006: immutable booking snapshot provenance
BEGIN;
ALTER TABLE price_snapshots ADD COLUMN IF NOT EXISTS price_quote_id uuid;
-- Historical snapshots created before authoritative quotes cannot be safely backfilled:
-- there is no deterministic snapshot-to-quote relationship. Leave those rows NULL.
-- All current booking writes attach the authoritative quote explicitly.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_price_snapshot_quote') THEN ALTER TABLE price_snapshots ADD CONSTRAINT fk_price_snapshot_quote FOREIGN KEY(price_quote_id) REFERENCES price_quotes(id); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_snapshot_quote ON price_snapshots(price_quote_id) WHERE price_quote_id IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES ('0006_price_snapshot_quote') ON CONFLICT(version) DO NOTHING;
COMMIT;
