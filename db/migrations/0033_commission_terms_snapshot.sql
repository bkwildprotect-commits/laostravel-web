-- Do not invent historical acceptance evidence. Legacy NULL snapshots fail closed.
BEGIN;
ALTER TABLE partner_commission_ledger ADD COLUMN IF NOT EXISTS commercial_terms_version text;
ALTER TABLE partner_commission_ledger ADD CONSTRAINT commission_terms_version_nonblank CHECK(commercial_terms_version IS NULL OR length(trim(commercial_terms_version))>0);
INSERT INTO schema_migrations(version) VALUES('0033_commission_terms_snapshot') ON CONFLICT(version) DO NOTHING;
COMMIT;
