BEGIN;
-- Separate identity, business eligibility, and the evidence used to approve each service.
CREATE TABLE IF NOT EXISTS partner_verification_documents (
  id uuid PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES partners(id),
  service_category text,
  document_type text NOT NULL,
  document_number text,
  issuing_authority text,
  issued_at date,
  expires_at date,
  evidence_key text NOT NULL,
  method text NOT NULL CHECK (method IN ('LAOSTRAVEL_REVIEW','GOVERNMENT_MANUAL','GOVERNMENT_API')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  reviewer_user_id uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at),
  CHECK (status <> 'APPROVED' OR (reviewer_user_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_partner_documents_review ON partner_verification_documents(partner_id,status,service_category);
-- Advertisements have a dedicated inventory. No ranking score, boost, or organic position column.
CREATE TABLE IF NOT EXISTS ad_placements (
  id uuid PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES partners(id),
  service_id uuid REFERENCES services(id),
  zone text NOT NULL CHECK(zone IN ('ADS_CENTER','SPONSORED_ZONE')),
  area text NOT NULL,
  budget_minor bigint NOT NULL CHECK(budget_minor >= 0),
  currency char(3) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','APPROVED','ACTIVE','PAUSED','ENDED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_ad_placements_zone ON ad_placements(zone,area,status,starts_at,ends_at);
INSERT INTO schema_migrations(version) VALUES ('0012_partner_verification_and_ads') ON CONFLICT (version) DO NOTHING;
COMMIT;
