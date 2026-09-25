-- LaosTravel shared PostgreSQL schema foundation (provider-neutral)
CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE user_profiles (user_id uuid PRIMARY KEY REFERENCES users(id), display_name text, locale varchar(5) NOT NULL DEFAULT 'en');
CREATE TABLE partners (id uuid PRIMARY KEY, name text NOT NULL, verification_status text NOT NULL DEFAULT 'DRAFT', business_status text NOT NULL DEFAULT 'DRAFT', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE partner_members (partner_id uuid REFERENCES partners(id), user_id uuid REFERENCES users(id), role text NOT NULL, PRIMARY KEY(partner_id,user_id));
CREATE TABLE services (id uuid PRIMARY KEY, partner_id uuid NOT NULL REFERENCES partners(id), category text NOT NULL, status text NOT NULL DEFAULT 'DRAFT', booking_mode text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE service_translations (service_id uuid REFERENCES services(id), locale varchar(5) NOT NULL, name text NOT NULL, description text, PRIMARY KEY(service_id,locale));
CREATE TABLE availability (id uuid PRIMARY KEY, service_id uuid NOT NULL REFERENCES services(id), starts_at timestamptz, ends_at timestamptz, capacity integer, remaining integer, version bigint NOT NULL DEFAULT 1, CHECK (remaining IS NULL OR remaining >= 0));
CREATE TABLE price_quotes (id uuid PRIMARY KEY, service_id uuid NOT NULL REFERENCES services(id), availability_id uuid NOT NULL REFERENCES availability(id), option_id text, service_date date NOT NULL, quantity integer NOT NULL CHECK(quantity>0), availability_token text NOT NULL UNIQUE, currency char(3) NOT NULL, base_amount bigint NOT NULL CHECK(base_amount>=0), fees_amount bigint NOT NULL DEFAULT 0 CHECK(fees_amount>=0), coupon_amount bigint NOT NULL DEFAULT 0 CHECK(coupon_amount>=0), points_benefit_amount bigint NOT NULL DEFAULT 0 CHECK(points_benefit_amount>=0), customer_total bigint NOT NULL CHECK(customer_total>=0), expires_at timestamptz NOT NULL, consumed_at timestamptz, consumed_booking_id uuid, created_at timestamptz NOT NULL DEFAULT now(), CHECK(customer_total=base_amount+fees_amount-coupon_amount-points_benefit_amount), CHECK ((consumed_at IS NULL)=(consumed_booking_id IS NULL)));
CREATE INDEX idx_price_quotes_expiry ON price_quotes(expires_at);
CREATE TABLE bookings (id uuid PRIMARY KEY, booking_ref text UNIQUE NOT NULL, user_id uuid NOT NULL REFERENCES users(id), status text NOT NULL, payment_status text NOT NULL DEFAULT 'PENDING', created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE price_quotes ADD CONSTRAINT fk_price_quotes_consumed_booking FOREIGN KEY(consumed_booking_id) REFERENCES bookings(id);
CREATE UNIQUE INDEX uq_price_quotes_consumed_booking ON price_quotes(consumed_booking_id) WHERE consumed_booking_id IS NOT NULL;
CREATE TABLE booking_items (id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id), service_id uuid NOT NULL REFERENCES services(id), availability_id uuid REFERENCES availability(id), quantity integer NOT NULL CHECK(quantity>0));
CREATE TABLE price_snapshots (booking_id uuid PRIMARY KEY REFERENCES bookings(id), price_quote_id uuid UNIQUE REFERENCES price_quotes(id), currency char(3) NOT NULL, base_amount bigint NOT NULL, fees_amount bigint NOT NULL DEFAULT 0, coupon_amount bigint NOT NULL DEFAULT 0, points_benefit_amount bigint NOT NULL DEFAULT 0, customer_total bigint NOT NULL, commission_rule_version text, commission_amount bigint, partner_amount bigint, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE payments (id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id), requirement text NOT NULL, status text NOT NULL, provider_ref text, amount bigint NOT NULL, currency char(3) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reviews (id uuid PRIMARY KEY, booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id), user_id uuid NOT NULL REFERENCES users(id), service_id uuid NOT NULL REFERENCES services(id), rating smallint NOT NULL CHECK(rating BETWEEN 1 AND 5), body text, status text NOT NULL DEFAULT 'PUBLISHED', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE coupons (id uuid PRIMARY KEY, code text UNIQUE NOT NULL, status text NOT NULL, rule_version text NOT NULL);
CREATE TABLE coupon_usages (coupon_id uuid REFERENCES coupons(id), booking_id uuid UNIQUE REFERENCES bookings(id), user_id uuid REFERENCES users(id), benefit_amount bigint NOT NULL CHECK (benefit_amount >= 0), PRIMARY KEY(coupon_id,booking_id));
CREATE TABLE points_ledger (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), booking_id uuid REFERENCES bookings(id), type text NOT NULL CHECK (type IN ('EARN','REDEEM','REVERSAL','EXPIRE','ADJUSTMENT')), points bigint NOT NULL CHECK (points > 0), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE emergency_contacts (id uuid PRIMARY KEY, area text NOT NULL, type text NOT NULL, name text NOT NULL, phone text NOT NULL, priority integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, verified_at timestamptz);
CREATE TABLE audit_logs (id uuid PRIMARY KEY, actor_user_id uuid REFERENCES users(id), action text NOT NULL, target_type text NOT NULL, target_id text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_services_partner ON services(partner_id);
CREATE INDEX idx_availability_service ON availability(service_id,starts_at);
CREATE INDEX idx_bookings_user ON bookings(user_id,created_at DESC);
CREATE INDEX idx_points_user ON points_ledger(user_id,created_at DESC);
CREATE UNIQUE INDEX uq_points_booking_redeem ON points_ledger(user_id,booking_id) WHERE booking_id IS NOT NULL AND type='REDEEM';


-- Exactly one commercial allocation path may exist for a booking.
CREATE TABLE partner_booking_commercial_paths (
  booking_id uuid PRIMARY KEY REFERENCES bookings(id),
  partner_id uuid NOT NULL REFERENCES partners(id),
  path text NOT NULL CHECK(path IN ('TRIAL_FREE','COMMISSIONABLE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id,partner_id,path)
);

-- Partner trial + commission ledger foundation.
-- Trial entitlement is ledger-based and must be allocated/finalized transactionally.
CREATE TABLE partner_trial_ledger (
  id uuid PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES partners(id),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
  commercial_path text NOT NULL DEFAULT 'TRIAL_FREE' CHECK(commercial_path='TRIAL_FREE'),
  trial_ordinal smallint,
  status text NOT NULL CHECK (status IN ('RESERVED','CONSUMED','RELEASED')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz,
  CHECK (trial_ordinal IS NULL OR trial_ordinal BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX uq_partner_trial_consumed_ordinal
  ON partner_trial_ledger(partner_id,trial_ordinal)
  WHERE status IN ('RESERVED','CONSUMED') AND trial_ordinal IS NOT NULL;

CREATE TABLE partner_commission_ledger (
  id uuid PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES partners(id),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
  commercial_path text NOT NULL DEFAULT 'COMMISSIONABLE' CHECK(commercial_path='COMMISSIONABLE'),
  status text NOT NULL CHECK (status IN ('PENDING','EARNED','VOID','SETTLED','REVERSED')),
  currency char(3) NOT NULL,
  commission_basis_amount bigint NOT NULL CHECK (commission_basis_amount >= 0),
  commission_rate_bps integer NOT NULL CHECK (commission_rate_bps >= 0),
  commission_amount bigint NOT NULL CHECK (commission_amount >= 0),
  partner_amount bigint NOT NULL CHECK (partner_amount >= 0),
  commission_rule_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  earned_at timestamptz,
  settled_at timestamptz
);
ALTER TABLE partner_trial_ledger ADD CONSTRAINT fk_trial_commercial_path FOREIGN KEY(booking_id,partner_id,commercial_path) REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path);
ALTER TABLE partner_commission_ledger ADD CONSTRAINT fk_commission_commercial_path FOREIGN KEY(booking_id,partner_id,commercial_path) REFERENCES partner_booking_commercial_paths(booking_id,partner_id,path);
CREATE INDEX idx_partner_trial_partner ON partner_trial_ledger(partner_id,status);
CREATE INDEX idx_partner_commission_partner ON partner_commission_ledger(partner_id,status,created_at DESC);


CREATE TABLE inventory_holds (
 id uuid PRIMARY KEY, service_id uuid NOT NULL REFERENCES services(id), availability_id uuid NOT NULL REFERENCES availability(id),
 booking_id uuid REFERENCES bookings(id), quantity integer NOT NULL CHECK(quantity>0),
 status text NOT NULL CHECK(status IN ('ACTIVE','CONSUMED','RELEASED','EXPIRED')),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_holds_availability ON inventory_holds(availability_id,status,expires_at);
CREATE TABLE booking_idempotency (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), idempotency_key text NOT NULL, request_hash text NOT NULL,
 booking_id uuid REFERENCES bookings(id), status text NOT NULL CHECK(status IN ('PROCESSING','COMPLETED','FAILED')),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,idempotency_key)
);
