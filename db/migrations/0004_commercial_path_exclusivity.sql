-- LaosTravel migration 0004: enforce one commercial path per booking.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.partner_trial_ledger') IS NULL OR to_regclass('public.partner_commission_ledger') IS NULL THEN
  RAISE EXCEPTION 'LaosTravel commercial ledger prerequisites are missing';
 END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_booking_commercial_path_exclusivity() RETURNS trigger AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.booking_id::text, 0));
 IF TG_TABLE_NAME='partner_trial_ledger' THEN
  IF EXISTS (SELECT 1 FROM partner_commission_ledger WHERE booking_id=NEW.booking_id) THEN
   RAISE EXCEPTION 'booking already has commission commercial path';
  END IF;
 ELSE
  IF EXISTS (SELECT 1 FROM partner_trial_ledger WHERE booking_id=NEW.booking_id) THEN
   RAISE EXCEPTION 'booking already has trial commercial path';
  END IF;
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trial_commercial_path_exclusive ON partner_trial_ledger;
CREATE TRIGGER trg_trial_commercial_path_exclusive BEFORE INSERT OR UPDATE OF booking_id ON partner_trial_ledger
FOR EACH ROW EXECUTE FUNCTION enforce_booking_commercial_path_exclusivity();

DROP TRIGGER IF EXISTS trg_commission_commercial_path_exclusive ON partner_commission_ledger;
CREATE TRIGGER trg_commission_commercial_path_exclusive BEFORE INSERT OR UPDATE OF booking_id ON partner_commission_ledger
FOR EACH ROW EXECUTE FUNCTION enforce_booking_commercial_path_exclusivity();

INSERT INTO schema_migrations(version) VALUES ('0004_commercial_path_exclusivity') ON CONFLICT(version) DO NOTHING;
COMMIT;
