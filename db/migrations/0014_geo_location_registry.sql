-- 0014: nationwide-ready GPS registry for partner venues, meeting points, and attractions.
-- Location publication is independent from commercial booking eligibility.
BEGIN;

CREATE TABLE IF NOT EXISTS geo_locations (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('PARTNER_VENUE','SERVICE_MEETING_POINT','ATTRACTION')),
  partner_id uuid REFERENCES partners(id),
  service_id uuid REFERENCES services(id),
  name text NOT NULL,
  area text NOT NULL,
  latitude numeric(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_meters integer CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0),
  source text NOT NULL CHECK (source IN ('PARTNER_PIN','LAOSTRAVEL_REVIEW','IMPORT')),
  verification_status text NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (verification_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  visibility text NOT NULL DEFAULT 'PUBLIC'
    CHECK (visibility IN ('PUBLIC','BOOKING_ONLY','PRIVATE')),
  verified_by_user_id uuid REFERENCES users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (verification_status <> 'VERIFIED' OR (verified_by_user_id IS NOT NULL AND verified_at IS NOT NULL)),
  CHECK (
    (kind='PARTNER_VENUE' AND partner_id IS NOT NULL AND service_id IS NULL) OR
    (kind='SERVICE_MEETING_POINT' AND partner_id IS NOT NULL AND service_id IS NOT NULL) OR
    (kind='ATTRACTION' AND service_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_geo_locations_area_public
  ON geo_locations(area,kind,verification_status,visibility);
CREATE INDEX IF NOT EXISTS idx_geo_locations_partner
  ON geo_locations(partner_id,kind) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_geo_locations_service
  ON geo_locations(service_id,kind) WHERE service_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_geo_partner_venue
  ON geo_locations(partner_id) WHERE kind='PARTNER_VENUE';
CREATE UNIQUE INDEX IF NOT EXISTS uq_geo_service_meeting_point
  ON geo_locations(service_id) WHERE kind='SERVICE_MEETING_POINT';

INSERT INTO schema_migrations(version) VALUES ('0014_geo_location_registry')
ON CONFLICT(version) DO NOTHING;
COMMIT;
