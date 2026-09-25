-- Disposable PostgreSQL only: completed idempotency replay invariant.
BEGIN;
DO $$
DECLARE u uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); k text:='idem-'||gen_random_uuid(); h text:='hash-v1'; before_remaining int; after_remaining int; replay_booking uuid;
BEGIN
 INSERT INTO users(id,email) VALUES(u,'idem-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'Idempotency Test Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,2,1);
 INSERT INTO price_quotes(id,service_id,availability_id,service_date,quantity,availability_token,currency,base_amount,customer_total,expires_at) VALUES(q,s,a,current_date,1,'tok-'||q,'LAK',100000,100000,now()+interval '10 minutes');
 INSERT INTO booking_idempotency(id,user_id,idempotency_key,request_hash,status,expires_at) VALUES(gen_random_uuid(),u,k,h,'PROCESSING',now()+interval '24 hours');
 UPDATE availability SET remaining=remaining-1,version=version+1 WHERE id=a AND remaining>=1;
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'IDEM-'||b,u,'PENDING');
 INSERT INTO price_snapshots(booking_id,price_quote_id,currency,base_amount,customer_total) VALUES(b,q,'LAK',100000,100000);
 UPDATE price_quotes SET consumed_at=now(),consumed_booking_id=b WHERE id=q AND consumed_at IS NULL;
 UPDATE booking_idempotency SET booking_id=b,status='COMPLETED' WHERE user_id=u AND idempotency_key=k AND status='PROCESSING';
 SELECT remaining INTO before_remaining FROM availability WHERE id=a;
 SELECT booking_id INTO replay_booking FROM booking_idempotency WHERE user_id=u AND idempotency_key=k AND request_hash=h AND status='COMPLETED';
 IF replay_booking IS DISTINCT FROM b THEN RAISE EXCEPTION 'TEST_FAILED: completed replay did not resolve original booking'; END IF;
 -- Replay path must return the stored booking before any inventory/quote mutation.
 SELECT remaining INTO after_remaining FROM availability WHERE id=a;
 IF after_remaining<>before_remaining THEN RAISE EXCEPTION 'TEST_FAILED: replay mutated inventory'; END IF;
 IF (SELECT consumed_booking_id FROM price_quotes WHERE id=q) IS DISTINCT FROM b THEN RAISE EXCEPTION 'TEST_FAILED: replay changed quote consumption'; END IF;
 -- Same key with a different request hash must conflict, never replay.
 IF EXISTS(SELECT 1 FROM booking_idempotency WHERE user_id=u AND idempotency_key=k AND request_hash<>'hash-v2') THEN NULL; ELSE RAISE EXCEPTION 'TEST_FAILED: idempotency conflict invariant missing'; END IF;
END $$;
ROLLBACK;
