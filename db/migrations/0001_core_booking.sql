-- LaosTravel migration 0001: core booking safety tables.
-- Provider-neutral PostgreSQL. Apply only after infrastructure approval.
BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- This migration deliberately verifies prerequisites instead of silently
-- creating a partial production schema.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL
     OR to_regclass('public.services') IS NULL
     OR to_regclass('public.availability') IS NULL
     OR to_regclass('public.bookings') IS NULL
     OR to_regclass('public.partners') IS NULL THEN
    RAISE EXCEPTION 'LaosTravel base schema prerequisites are missing';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_holds (
 id uuid PRIMARY KEY,
 service_id uuid NOT NULL REFERENCES services(id),
 availability_id uuid NOT NULL REFERENCES availability(id),
 booking_id uuid REFERENCES bookings(id),
 quantity integer NOT NULL CHECK(quantity>0),
 status text NOT NULL CHECK(status IN ('ACTIVE','CONSUMED','RELEASED','EXPIRED')),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_holds_availability
 ON inventory_holds(availability_id,status,expires_at);

CREATE TABLE IF NOT EXISTS booking_idempotency (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 idempotency_key text NOT NULL,
 request_hash text NOT NULL,
 booking_id uuid REFERENCES bookings(id),
 status text NOT NULL CHECK(status IN ('PROCESSING','COMPLETED','FAILED')),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,idempotency_key)
);

INSERT INTO schema_migrations(version) VALUES ('0001_core_booking')
ON CONFLICT(version) DO NOTHING;
COMMIT;
