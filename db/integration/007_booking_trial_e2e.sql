-- Disposable PostgreSQL: verifies the first five bookings can share the core booking/trial invariants.
BEGIN;
DO $$
DECLARE p uuid:=gen_random_uuid();u uuid:=gen_random_uuid();s uuid:=gen_random_uuid();a uuid:=gen_random_uuid();q uuid;b uuid;i int;
BEGIN
 INSERT INTO users(id,email) VALUES(u,'e2e-'||u||'@example.invalid');
 INSERT INTO partners(id,name,verification_status,business_status) VALUES(p,'E2E Trial Partner','VERIFIED','ACTIVE');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,5,1);
 FOR i IN 1..5 LOOP
  UPDATE availability SET remaining=remaining-1,version=version+1 WHERE id=a AND remaining>=1;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: inventory reservation failed at booking %',i;END IF;
  b:=gen_random_uuid();
  INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'E2E-'||i||'-'||b,u,'PENDING');
  INSERT INTO booking_items(id,booking_id,service_id,availability_id,quantity) VALUES(gen_random_uuid(),b,s,a,1);\n  INSERT INTO price_snapshots(booking_id,price_quote_id,currency,base_amount,fees_amount,coupon_amount,points_benefit_amount,customer_total) VALUES(b,q,'LAK',100000,0,0,0,100000);\n  UPDATE price_quotes SET consumed_at=now(),consumed_booking_id=b WHERE id=q AND consumed_at IS NULL;
  INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
  INSERT INTO partner_trial_ledger(id,partner_id,booking_id,commercial_path,trial_ordinal,status) VALUES(gen_random_uuid(),p,b,'TRIAL_FREE',i,'RESERVED');
 END LOOP;
 IF (SELECT remaining FROM availability WHERE id=a)<>0 THEN RAISE EXCEPTION 'TEST_FAILED: expected inventory 0';END IF;
 IF (SELECT count(*) FROM partner_trial_ledger WHERE partner_id=p AND status='RESERVED')<>5 THEN RAISE EXCEPTION 'TEST_FAILED: expected five reserved trial bookings';END IF;
 IF (SELECT count(DISTINCT trial_ordinal) FROM partner_trial_ledger WHERE partner_id=p AND status='RESERVED')<>5 THEN RAISE EXCEPTION 'TEST_FAILED: trial ordinals are not unique';END IF;
 IF EXISTS(SELECT 1 FROM partner_booking_commercial_paths WHERE partner_id=p AND path<>'TRIAL_FREE') THEN RAISE EXCEPTION 'TEST_FAILED: unexpected commercial path';END IF;
END $$;
ROLLBACK;
