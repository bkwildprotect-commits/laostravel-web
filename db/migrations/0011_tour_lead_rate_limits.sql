BEGIN;
CREATE TABLE IF NOT EXISTS tour_lead_rate_limits (
  rate_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rate_key, window_started_at)
);
CREATE INDEX IF NOT EXISTS idx_tour_lead_rate_limits_updated_at ON tour_lead_rate_limits(updated_at);
INSERT INTO schema_migrations(version) VALUES ('0011_tour_lead_rate_limits') ON CONFLICT (version) DO NOTHING;
COMMIT;
