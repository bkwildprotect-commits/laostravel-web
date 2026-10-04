-- 0027: canonical Partner verification requirements and auditable final decision.
BEGIN;
CREATE TABLE IF NOT EXISTS partner_verification_requirements (
 document_type text PRIMARY KEY,
 required boolean NOT NULL DEFAULT true,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO partner_verification_requirements(document_type) VALUES
 ('BUSINESS_LICENSE'),('OWNER_OR_MANAGER_ID'),('SETTLEMENT_BANK_ACCOUNT')
ON CONFLICT(document_type) DO NOTHING;
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_verification_status_check;
ALTER TABLE partners ADD CONSTRAINT partners_verification_status_check
 CHECK(verification_status IN ('DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED'));
INSERT INTO schema_migrations(version) VALUES ('0027_partner_final_verification') ON CONFLICT(version) DO NOTHING;
COMMIT;
