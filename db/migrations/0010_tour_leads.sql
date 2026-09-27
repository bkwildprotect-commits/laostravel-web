BEGIN;

CREATE TABLE IF NOT EXISTS tour_leads (
  id UUID PRIMARY KEY,
  submission_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  requested_date DATE NOT NULL,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 100),
  consent BOOLEAN NOT NULL CHECK (consent = TRUE),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CONTACTED','CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_leads_created_at ON tour_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_tour_leads_status_created_at ON tour_leads(status,created_at);

INSERT INTO schema_migrations(version)
VALUES ('0010_tour_leads')
ON CONFLICT (version) DO NOTHING;

COMMIT;
