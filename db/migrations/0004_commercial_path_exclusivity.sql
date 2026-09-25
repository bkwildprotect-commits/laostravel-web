-- LaosTravel migration 0004: declaratively enforce one commercial path per booking.
-- Not yet applied to production; replaces the earlier trigger-based draft before first deployment.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.partner_trial_ledger') IS NULL OR to_regclass('public.partner_commission_ledger') IS NULL THEN
  RAISE EXCEPTION 'LaosTravel commercial ledger prerequisites are missing';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS partner_booking_commercial_paths (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id),
 partner_id uuid NOT NULL REFERENCES partners(id),
 path text NOT NULL CHECK(path IN ('TRIAL_FREE','COMMISSIONABLE')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,partner_id,path)
);

ALTER TABLE partner_trial_ledger
 ADD COLUMN commercial_path text NOT NULL DEFAULT 'TRIAL_FREE'
 CHECK(commercial_path='TRIAL_FREE');
ALTER TABLE partner_commission_ledger
 ADD COLUMN commercial_path text NOT NULL DEFAULT 'COMMISSIONABLE'
 CHECK(commercial_path='COMMISSIONABLE');

ALTER TABLE partner_trial_ledger ADD CONSTRAINT fk_trial_commercial_path
 FOREIGN KEY(booking_id,partner_id,commercial_path)
 REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path);
ALTER TABLE partner_commission_ledger ADD CONSTRAINT fk_commission_commercial_path
 FOREIGN KEY(booking_id,partner_id,commercial_path)
 REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path);

INSERT INTO schema_migrations(version) VALUES ('0004_commercial_path_exclusivity') ON CONFLICT(version) DO NOTHING;
COMMIT;
