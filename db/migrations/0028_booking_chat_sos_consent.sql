-- 0028: booking-scoped Partner/Traveller chat, translation records and explicit SOS location consent.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_messages (
 id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id), sender_user_id uuid NOT NULL REFERENCES users(id),
 original_locale varchar(10) NOT NULL, original_text text NOT NULL CHECK(length(original_text) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_messages_thread ON booking_messages(booking_id,created_at,id);
CREATE TABLE IF NOT EXISTS booking_message_translations (
 message_id uuid NOT NULL REFERENCES booking_messages(id) ON DELETE CASCADE, locale varchar(10) NOT NULL,
 translated_text text NOT NULL CHECK(length(translated_text) BETWEEN 1 AND 8000), provider text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(message_id,locale)
);
CREATE TABLE IF NOT EXISTS sos_location_consents (
 id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id), traveller_user_id uuid NOT NULL REFERENCES users(id),
 status text NOT NULL CHECK(status IN ('GRANTED','REVOKED')), granted_at timestamptz, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK((status='GRANTED' AND granted_at IS NOT NULL) OR (status='REVOKED' AND revoked_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_sos_consent_booking ON sos_location_consents(booking_id,traveller_user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS sos_location_shares (
 id uuid PRIMARY KEY, consent_id uuid NOT NULL REFERENCES sos_location_consents(id), booking_id uuid NOT NULL REFERENCES bookings(id),
 latitude numeric(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90), longitude numeric(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 accuracy_m numeric(10,2), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_share_booking ON sos_location_shares(booking_id,created_at DESC);
INSERT INTO schema_migrations(version) VALUES ('0028_booking_chat_sos_consent') ON CONFLICT(version) DO NOTHING;
COMMIT;
