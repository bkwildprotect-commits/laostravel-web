-- MANUAL: isolated LaosTravel Staging only, after bootstrap 0001-0034.
-- Transaction-local acknowledgement; never run on Production.
BEGIN;
DO $$
DECLARE t text; r text;
BEGIN
 IF current_setting('laostravel.staging_isolation_approved',true) IS DISTINCT FROM 'yes' THEN
  RAISE EXCEPTION 'Explicit isolated Staging acknowledgement required';
 END IF;
 FOREACH t IN ARRAY ARRAY[
  'ad_placements',
  'admin_role_assignments',
  'audit_logs',
  'auth_identities',
  'availability',
  'booking_designated_stop_snapshots',
  'booking_idempotency',
  'booking_items',
  'booking_location_snapshots',
  'booking_message_translations',
  'booking_messages',
  'bookings',
  'commission_rules',
  'coupon_usages',
  'coupons',
  'emergency_contacts',
  'emergency_directory_entries',
  'geo_locations',
  'intercity_designated_stops',
  'intercity_pickup_requests',
  'inventory_holds',
  'partner_application_idempotency',
  'partner_applications',
  'partner_booking_commercial_paths',
  'partner_commercial_terms',
  'partner_commission_ledger',
  'partner_members',
  'partner_trial_ledger',
  'partner_verification_documents',
  'partner_verification_requirements',
  'partners',
  'payment_webhook_events',
  'payments',
  'points_ledger',
  'price_quotes',
  'price_snapshots',
  'reviews',
  'schema_migrations',
  'service_area_assignments',
  'service_areas',
  'service_capability_details',
  'service_price_offers',
  'service_translations',
  'services',
  'sos_location_consents',
  'sos_location_shares',
  'tour_lead_rate_limits',
  'tour_leads',
  'user_profiles',
  'users'
 ] LOOP
  IF to_regclass(format('public.%I',t)) IS NULL THEN
   RAISE EXCEPTION 'Bootstrap prerequisite missing: %',t;
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r);
   END IF;
  END LOOP;
 END LOOP;
 -- Defaults apply to tables subsequently created by this migration owner only.
 ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',r);
  END IF;
 END LOOP;
END $$;
COMMIT;
