-- 0015: internal administrative role assignments.
-- Authority is server-side and references an authenticated LaosTravel user.
BEGIN;
CREATE TABLE IF NOT EXISTS admin_role_assignments (
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('ADMIN','LOCATION_REVIEWER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  granted_by_user_id uuid REFERENCES users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY(user_id,role),
  CHECK ((status='ACTIVE' AND revoked_at IS NULL) OR status='REVOKED')
);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_role_assignments(user_id,role) WHERE status='ACTIVE';
INSERT INTO schema_migrations(version) VALUES ('0015_admin_role_assignments') ON CONFLICT(version) DO NOTHING;
COMMIT;
