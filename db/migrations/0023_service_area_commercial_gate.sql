-- 0023: normalized commercial service-area gate. Geography may exist nationwide; booking is separately enabled.
BEGIN;
CREATE TABLE IF NOT EXISTS service_areas (
 code text PRIMARY KEY,
 name_lo text NOT NULL,
 name_en text NOT NULL,
 country_code char(2) NOT NULL DEFAULT 'LA',
 commercial_status text NOT NULL CHECK(commercial_status IN ('REGISTRATION_ONLY','BOOKING_ENABLED','SUSPENDED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_area_assignments (
 service_id uuid PRIMARY KEY REFERENCES services(id),
 area_code text NOT NULL REFERENCES service_areas(code),
 assigned_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO service_areas(code,name_lo,name_en,country_code,commercial_status)
VALUES('LA-VTE-VV','ວັງວຽງ','Vang Vieng','LA','BOOKING_ENABLED')
ON CONFLICT(code) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES ('0023_service_area_commercial_gate') ON CONFLICT(version) DO NOTHING;
COMMIT;
