-- Disposable PostgreSQL only: quote replay and rollback invariants.
BEGIN;
DO $$
DECLARE p uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); b1 uuid:=gen_random_uuid(); b2 uuid:=gen_random_uuid();
BEGIN
 INSERT INTO users(id,email) VALUES(u,'quote-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'Quote Test Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,1,1);
 INSERT INTO price_quotes(id,service_id,availability_id,service_date,quantity,availability_token,currency,base_amount,customer_total,expires_at) VALUES(q,s,a,current_date,1,'tok-'||q,'LAK',100000,100000,now()+interval '10 minutes');
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b1,'QR1-'||b1,u,'PENDING');
 UPDATE price_quotes SET consumed_at=now(),consumed_booking_id=b1 WHERE id=q AND consumed_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: first quote consumption failed'; END IF;
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b2,'QR2-'||b2,u,'PENDING');
 UPDATE price_quotes SET consumed_at=now(),consumed_booking_id=b2 WHERE id=q AND consumed_at IS NULL;
 IF FOUND THEN RAISE EXCEPTION 'TEST_FAILED: quote replay was accepted'; END IF;
END $$;
ROLLBACK;

-- A failed transaction must restore finite inventory.
DO $$
DECLARE p uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); a uuid:=gen_random_uuid();
BEGIN
 INSERT INTO partners(id,name) VALUES(p,'Rollback Test Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,1,1);
 BEGIN
  UPDATE availability SET remaining=remaining-1,version=version+1 WHERE id=a AND remaining>=1;
  RAISE EXCEPTION 'intentional rollback';
 EXCEPTION WHEN raise_exception THEN NULL;
 END;
 IF (SELECT remaining FROM availability WHERE id=a)<>1 THEN RAISE EXCEPTION 'TEST_FAILED: inventory was not restored after rollback'; END IF;
END $$;
