-- LaosTravel migration 0003: payment webhook idempotency.
BEGIN;
CREATE TABLE IF NOT EXISTS payment_webhook_events (
 provider text NOT NULL,
 event_id text NOT NULL,
 payload_hash text NOT NULL,
 status text NOT NULL CHECK(status IN ('PROCESSING','COMPLETED','FAILED')),
 payment_id uuid REFERENCES payments(id),
 received_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 PRIMARY KEY(provider,event_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_status ON payment_webhook_events(status,received_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_ref ON payments(provider_ref) WHERE provider_ref IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES ('0003_payment_webhook_idempotency') ON CONFLICT(version) DO NOTHING;
COMMIT;
