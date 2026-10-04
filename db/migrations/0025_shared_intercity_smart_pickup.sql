-- 0025: shared intercity transport contract for Web + Mobile.
BEGIN;

ALTER TABLE service_capability_details
  ADD COLUMN IF NOT EXISTS smart_pickup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_pickup_max_detour_m integer,
  ADD COLUMN IF NOT EXISTS pickup_requires_operator_approval boolean NOT NULL DEFAULT true;

ALTER TABLE service_capability_details
  DROP CONSTRAINT IF EXISTS service_capability_vehicle_type_check;
ALTER TABLE service_capability_details
  ADD CONSTRAINT service_capability_vehicle_type_check
  CHECK(vehicle_type IS NULL OR vehicle_type IN ('VIP_VAN','BUS'));

ALTER TABLE service_capability_details
  DROP CONSTRAINT IF EXISTS service_capability_smart_pickup_check;
ALTER TABLE service_capability_details
  ADD CONSTRAINT service_capability_smart_pickup_check CHECK(
    (smart_pickup_enabled=false AND smart_pickup_max_detour_m IS NULL)
    OR
    (vehicle_type='VIP_VAN' AND smart_pickup_enabled=true
      AND smart_pickup_max_detour_m BETWEEN 1 AND 10000
      AND pickup_requires_operator_approval=true)
  );

CREATE TABLE IF NOT EXISTS intercity_pickup_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
 pickup_latitude numeric(9,6) NOT NULL CHECK(pickup_latitude BETWEEN -90 AND 90),
 pickup_longitude numeric(9,6) NOT NULL CHECK(pickup_longitude BETWEEN -180 AND 180),
 pickup_label text,
 requested_at timestamptz NOT NULL DEFAULT now(),
 operator_status text NOT NULL DEFAULT 'PENDING'
   CHECK(operator_status IN ('PENDING','ACCEPTED','DECLINED','CANCELLED')),
 decided_at timestamptz,
 route_detour_m integer CHECK(route_detour_m IS NULL OR route_detour_m>=0),
 route_detour_seconds integer CHECK(route_detour_seconds IS NULL OR route_detour_seconds>=0),
 CHECK((operator_status='PENDING' AND decided_at IS NULL) OR operator_status<>'PENDING')
);

INSERT INTO schema_migrations(version)
VALUES ('0025_shared_intercity_smart_pickup') ON CONFLICT(version) DO NOTHING;
COMMIT;
