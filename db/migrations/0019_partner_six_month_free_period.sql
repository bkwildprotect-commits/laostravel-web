-- 0019: per-partner six-calendar-month launch free period.
-- Starts only when an approved/active partner is commercially activated.
BEGIN;
CREATE TABLE IF NOT EXISTS partner_commercial_terms (
 partner_id uuid PRIMARY KEY REFERENCES partners(id),
 model text NOT NULL CHECK(model IN ('LAUNCH_FREE','AWAITING_NEW_TERMS','COMMISSION')),
 free_started_at timestamptz,
 free_ends_at timestamptz,
 accepted_terms_version text,
 activated_by_user_id uuid REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((model<>'LAUNCH_FREE') OR (free_started_at IS NOT NULL AND free_ends_at IS NOT NULL AND free_ends_at>free_started_at))
);
ALTER TABLE partner_booking_commercial_paths DROP CONSTRAINT IF EXISTS partner_booking_commercial_paths_path_check;
ALTER TABLE partner_booking_commercial_paths ADD CONSTRAINT partner_booking_commercial_paths_path_check CHECK(path IN ('LAUNCH_FREE','COMMISSIONABLE','TRIAL_FREE'));
INSERT INTO schema_migrations(version) VALUES ('0019_partner_six_month_free_period') ON CONFLICT(version) DO NOTHING;
COMMIT;
