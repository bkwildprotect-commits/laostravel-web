-- 0009: enforce that authoritative price quotes reference availability for the same service
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS uq_availability_id_service_id ON availability(id,service_id);
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM price_quotes q JOIN availability a ON a.id=q.availability_id WHERE q.service_id<>a.service_id) THEN\n  RAISE EXCEPTION 'Cannot enforce quote availability integrity: mismatched existing rows';\n END IF;\n IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_price_quotes_availability_service') THEN
  ALTER TABLE price_quotes ADD CONSTRAINT fk_price_quotes_availability_service
   FOREIGN KEY(availability_id,service_id) REFERENCES availability(id,service_id);
 END IF;
END $$;
INSERT INTO schema_migrations(version) VALUES ('0009_service_availability_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
