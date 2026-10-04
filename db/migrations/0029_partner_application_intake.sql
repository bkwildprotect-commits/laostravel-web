-- 0029: authenticated Partner application intake; sensitive evidence remains in private object storage.
BEGIN;
CREATE TABLE IF NOT EXISTS partner_applications (
 id uuid PRIMARY KEY,
 applicant_user_id uuid NOT NULL REFERENCES users(id),
 partner_id uuid REFERENCES partners(id),
 category text NOT NULL CHECK(category IN ('hotel','restaurant','attraction','tour-activity','transport','car-rental','guide')),
 business_name text NOT NULL,
 contact_name text NOT NULL,
 email text NOT NULL,
 phone text NOT NULL,
 operating_area text NOT NULL,
 status text NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED','UNDER_REVIEW','NEEDS_CHANGES','REJECTED','APPROVED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_applications_user ON partner_applications(applicant_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_applications_review ON partner_applications(status,created_at);
INSERT INTO schema_migrations(version) VALUES ('0029_partner_application_intake') ON CONFLICT(version) DO NOTHING;
COMMIT;
