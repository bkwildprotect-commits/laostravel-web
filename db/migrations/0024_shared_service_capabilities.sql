-- 0024: shared service capabilities aligned with the current Mobile/Web product.
BEGIN;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_kind text;
ALTER TABLE services ADD CONSTRAINT services_kind_check CHECK(service_kind IS NULL OR service_kind IN ('STAY','RESTAURANT','ATTRACTION','ACTIVITY','INTERCITY_TRANSPORT','SELF_DRIVE_RENTAL','GUIDED_TRIP','PRIVATE_TRANSFER'));
CREATE TABLE IF NOT EXISTS service_capability_details(
 service_id uuid PRIMARY KEY REFERENCES services(id),
 origin_area_code text REFERENCES service_areas(code),
 destination_area_code text REFERENCES service_areas(code),
 vehicle_type text,
 total_capacity integer CHECK(total_capacity IS NULL OR total_capacity>0),
 pricing_unit text CHECK(pricing_unit IS NULL OR pricing_unit IN ('PER_BOOKING','PER_PERSON','PER_DAY','PER_HOUR','PRIVATE_GROUP')),
 min_guests integer CHECK(min_guests IS NULL OR min_guests>0),
 max_guests integer CHECK(max_guests IS NULL OR max_guests>0),
 seller_type text CHECK(seller_type IS NULL OR seller_type IN ('LICENSED_GUIDE','TOUR_OPERATOR','TRAVEL_CREATOR')),
 publication_status text CHECK(publication_status IS NULL OR publication_status IN ('DRAFT','SUBMITTED','APPROVED','PUBLISHED')),
 CHECK(min_guests IS NULL OR max_guests IS NULL OR max_guests>=min_guests)
);
INSERT INTO schema_migrations(version) VALUES ('0024_shared_service_capabilities') ON CONFLICT(version) DO NOTHING;
COMMIT;