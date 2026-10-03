-- 0018: versioned commission rules. No rule is seeded or auto-activated.
BEGIN;
CREATE TABLE IF NOT EXISTS commission_rules (
 version text PRIMARY KEY,
 service_category text,
 rate_bps integer NOT NULL CHECK(rate_bps BETWEEN 0 AND 10000),
 status text NOT NULL CHECK(status IN ('DRAFT','ACTIVE','RETIRED')),
 effective_from timestamptz NOT NULL,
 effective_until timestamptz,
 created_by_user_id uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(effective_until IS NULL OR effective_until>effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_commission_rule_category
 ON commission_rules(COALESCE(service_category,'*')) WHERE status='ACTIVE';
INSERT INTO schema_migrations(version) VALUES ('0018_versioned_commission_rules') ON CONFLICT(version) DO NOTHING;
COMMIT;
