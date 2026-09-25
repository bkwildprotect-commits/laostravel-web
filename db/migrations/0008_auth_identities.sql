-- 0008: external auth subject to internal LaosTravel user mapping
BEGIN;
CREATE TABLE IF NOT EXISTS auth_identities (
 issuer text NOT NULL,
 subject text NOT NULL,
 user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(issuer,subject),
 UNIQUE(issuer,user_id)
);
INSERT INTO schema_migrations(version) VALUES ('0008_auth_identities') ON CONFLICT(version) DO NOTHING;
COMMIT;
