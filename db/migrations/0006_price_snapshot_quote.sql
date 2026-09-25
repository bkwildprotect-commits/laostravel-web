-- 0006: immutable booking snapshot provenance
BEGIN;
ALTER TABLE price_snapshots ADD COLUMN IF NOT EXISTS price_quote_id uuid;
UPDATE price_snapshots ps SET price_quote_id=pq.id FROM price_quotes pq WHERE ps.price_quote_id IS NULL AND pq.id::text=(SELECT NULL::text);
-- Existing historical rows may legitimately predate authoritative quotes; new application writes require a quote.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_price_snapshot_quote') THEN ALTER TABLE price_snapshots ADD CONSTRAINT fk_price_snapshot_quote FOREIGN KEY(price_quote_id) REFERENCES price_quotes(id); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_snapshot_quote ON price_snapshots(price_quote_id) WHERE price_quote_id IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES ('0006_price_snapshot_quote') ON CONFLICT(version) DO NOTHING;
COMMIT;
