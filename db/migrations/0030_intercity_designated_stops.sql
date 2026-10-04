-- 0030: verified designated boarding/drop-off points for intercity Bus services.
BEGIN;

CREATE TABLE IF NOT EXISTS intercity_designated_stops(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
 area_code text NOT NULL REFERENCES service_areas(code),
 name_lo text NOT NULL CHECK(char_length(btrim(name_lo)) BETWEEN 1 AND 160),
 name_en text NOT NULL CHECK(char_length(btrim(name_en)) BETWEEN 1 AND 160),
 stop_role text NOT NULL CHECK(stop_role IN ('BOARDING','DROPOFF','BOTH')),
 stop_order smallint NOT NULL CHECK(stop_order>=0),
 latitude numeric(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude numeric(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 verification_status text NOT NULL DEFAULT 'PENDING'
   CHECK(verification_status IN ('PENDING','VERIFIED','REJECTED')),
 active boolean NOT NULL DEFAULT true,
 created_by_user_id uuid NOT NULL REFERENCES users(id),
 verified_by_user_id uuid REFERENCES users(id),
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(service_id,stop_order),
 CHECK(
  (verification_status='VERIFIED' AND verified_by_user_id IS NOT NULL AND verified_at IS NOT NULL)
  OR
  (verification_status<>'VERIFIED' AND verified_by_user_id IS NULL AND verified_at IS NULL)
 )
);

CREATE INDEX IF NOT EXISTS idx_intercity_designated_stops_public
 ON intercity_designated_stops(service_id,active,verification_status,stop_order);

INSERT INTO schema_migrations(version)
VALUES ('0030_intercity_designated_stops') ON CONFLICT(version) DO NOTHING;
COMMIT;
