-- 0032: auditable manual Partner application decisions.
-- Final approval/rejection must identify the internal reviewer and decision time.
BEGIN;
ALTER TABLE partner_applications
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_note text;

ALTER TABLE partner_applications
  DROP CONSTRAINT IF EXISTS partner_applications_final_decision_audit_check;
ALTER TABLE partner_applications
  ADD CONSTRAINT partner_applications_final_decision_audit_check CHECK (
    status NOT IN ('APPROVED','REJECTED')
    OR (reviewer_user_id IS NOT NULL AND decided_at IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_partner_applications_reviewer
  ON partner_applications(reviewer_user_id, decided_at DESC)
  WHERE reviewer_user_id IS NOT NULL;

INSERT INTO schema_migrations(version)
VALUES ('0032_partner_application_decision_audit')
ON CONFLICT(version) DO NOTHING;
COMMIT;
