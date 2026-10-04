-- 0026: verified emergency directory shared by Web + Mobile.
BEGIN;

CREATE TABLE IF NOT EXISTS emergency_directory_entries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 agency_name text NOT NULL,
 agency_type text NOT NULL CHECK(agency_type IN ('POLICE','TOURIST_POLICE','FIRE','AMBULANCE','HOSPITAL','RESCUE','ELECTRICITY','OTHER')),
 phone_number text NOT NULL,
 latitude numeric(9,6) CHECK(latitude BETWEEN -90 AND 90),
 longitude numeric(9,6) CHECK(longitude BETWEEN -180 AND 180),
 locality text,
 province text,
 is_national boolean NOT NULL DEFAULT false,
 is_verified boolean NOT NULL DEFAULT false,
 verified_at timestamptz,
 verified_by text,
 source_note text,
 active boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(
   (is_verified=false AND verified_at IS NULL)
   OR
   (is_verified=true AND verified_at IS NOT NULL AND verified_by IS NOT NULL)
 ),
 CHECK(is_national=true OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_emergency_directory_phone_agency
 ON emergency_directory_entries(agency_name, phone_number);

CREATE INDEX IF NOT EXISTS idx_emergency_directory_verified_local
 ON emergency_directory_entries(is_verified, active, province, locality);

INSERT INTO schema_migrations(version)
VALUES ('0026_verified_emergency_directory') ON CONFLICT(version) DO NOTHING;
COMMIT;
