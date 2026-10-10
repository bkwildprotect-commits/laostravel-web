BEGIN;
-- Intake retries are scoped to the authenticated internal user.
CREATE TABLE IF NOT EXISTS partner_application_idempotency (
 user_id uuid NOT NULL REFERENCES users(id),
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 128),
 request_hash text NOT NULL,
 application_id uuid REFERENCES partner_applications(id),
 PRIMARY KEY(user_id,idempotency_key)
);
ALTER TABLE partner_application_idempotency ENABLE ROW LEVEL SECURITY;
INSERT INTO schema_migrations(version) VALUES('0034_partner_application_idempotency') ON CONFLICT(version) DO NOTHING;
COMMIT;
