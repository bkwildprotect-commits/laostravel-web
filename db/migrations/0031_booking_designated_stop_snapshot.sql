-- 0031: immutable designated-stop snapshot chosen for a Bus booking.
BEGIN;

CREATE TABLE IF NOT EXISTS booking_designated_stop_snapshots(
 booking_id uuid PRIMARY KEY REFERENCES bookings(id),
 service_id uuid NOT NULL REFERENCES services(id),
 source_stop_id uuid NOT NULL REFERENCES intercity_designated_stops(id),
 area_code text NOT NULL REFERENCES service_areas(code),
 name_lo text NOT NULL,
 name_en text NOT NULL,
 stop_role text NOT NULL CHECK(stop_role IN ('BOARDING','BOTH')),
 stop_order smallint NOT NULL CHECK(stop_order>=0),
 latitude numeric(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude numeric(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 captured_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,service_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_designated_stop_source
 ON booking_designated_stop_snapshots(source_stop_id);

INSERT INTO schema_migrations(version)
VALUES ('0031_booking_designated_stop_snapshot') ON CONFLICT(version) DO NOTHING;
COMMIT;
