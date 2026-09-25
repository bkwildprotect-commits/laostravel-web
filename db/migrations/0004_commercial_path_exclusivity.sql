-- LaosTravel migration 0004: declaratively enforce one commercial path per booking.
-- Idempotent against the desired-state reference schema.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.partner_trial_ledger') IS NULL OR to_regclass('public.partner_commission_ledger') IS NULL THEN RAISE EXCEPTION 'LaosTravel commercial ledger prerequisites are missing'; END IF;
END $$;
CREATE TABLE IF NOT EXISTS partner_booking_commercial_paths (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id), partner_id uuid NOT NULL REFERENCES partners(id),
 path text NOT NULL CHECK(path IN ('TRIAL_FREE','COMMISSIONABLE')), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,partner_id,path)
);
ALTER TABLE partner_trial_ledger ADD COLUMN IF NOT EXISTS commercial_path text;
ALTER TABLE partner_commission_ledger ADD COLUMN IF NOT EXISTS commercial_path text;
UPDATE partner_trial_ledger SET commercial_path='TRIAL_FREE' WHERE commercial_path IS NULL;
UPDATE partner_commission_ledger SET commercial_path='COMMISSIONABLE' WHERE commercial_path IS NULL;
ALTER TABLE partner_trial_ledger ALTER COLUMN commercial_path SET DEFAULT 'TRIAL_FREE', ALTER COLUMN commercial_path SET NOT NULL;
ALTER TABLE partner_commission_ledger ALTER COLUMN commercial_path SET DEFAULT 'COMMISSIONABLE', ALTER COLUMN commercial_path SET NOT NULL;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='partner_trial_commercial_path_check' AND conrelid='partner_trial_ledger'::regclass) THEN ALTER TABLE partner_trial_ledger ADD CONSTRAINT partner_trial_commercial_path_check CHECK(commercial_path='TRIAL_FREE'); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='partner_commission_commercial_path_check' AND conrelid='partner_commission_ledger'::regclass) THEN ALTER TABLE partner_commission_ledger ADD CONSTRAINT partner_commission_commercial_path_check CHECK(commercial_path='COMMISSIONABLE'); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_trial_commercial_path' AND conrelid='partner_trial_ledger'::regclass) THEN ALTER TABLE partner_trial_ledger ADD CONSTRAINT fk_trial_commercial_path FOREIGN KEY(booking_id,partner_id,commercial_path) REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_commission_commercial_path' AND conrelid='partner_commission_ledger'::regclass) THEN ALTER TABLE partner_commission_ledger ADD CONSTRAINT fk_commission_commercial_path FOREIGN KEY(booking_id,partner_id,commercial_path) REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path); END IF;
END $$;
INSERT INTO schema_migrations(version) VALUES ('0004_commercial_path_exclusivity') ON CONFLICT(version) DO NOTHING;
COMMIT;
