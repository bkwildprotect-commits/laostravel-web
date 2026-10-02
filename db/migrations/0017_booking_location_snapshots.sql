-- 0017: immutable verified meeting-point snapshots for confirmed bookings.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_location_snapshots (
 booking_item_id uuid PRIMARY KEY REFERENCES booking_items(id),
 booking_id uuid NOT NULL REFERENCES bookings(id),
 service_id uuid NOT NULL REFERENCES services(id),
 source_location_id uuid NOT NULL REFERENCES geo_locations(id),
 name text NOT NULL,
 area text NOT NULL,
 latitude numeric(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude numeric(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 captured_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,service_id)
);
CREATE INDEX IF NOT EXISTS idx_booking_location_snapshots_booking ON booking_location_snapshots(booking_id);
INSERT INTO schema_migrations(version) VALUES ('0017_booking_location_snapshots') ON CONFLICT(version) DO NOTHING;
COMMIT;
