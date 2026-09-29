-- Disposable PostgreSQL only: prove booking status and trial ledger rollback together.
DO $$
DECLARE p uuid:=gen_random_uuid();u uuid:=gen_random_uuid();s uuid:=gen_random_uuid();a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();t uuid:=gen_random_uuid();h uuid:=gen_random_uuid();
BEGIN
 INSERT INTO users(id,email) VALUES(u,'lifecycle-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'Lifecycle Rollback Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,1,1);
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'LCR-'||b,u,'CONFIRMED');
 INSERT INTO booking_items(id,booking_id,service_id,availability_id,quantity) VALUES(gen_random_uuid(),b,s,a,1);
 INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
 INSERT INTO partner_trial_ledger(id,partner_id,booking_id,commercial_path,trial_ordinal,status) VALUES(t,p,b,'TRIAL_FREE',1,'RESERVED');
 INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) VALUES(h,s,a,b,1,'ACTIVE',now()+interval '15 minutes');

 BEGIN
  UPDATE bookings SET status='COMPLETED' WHERE id=b;
  UPDATE partner_trial_ledger SET status='CONSUMED',consumed_at=now(),released_at=NULL WHERE booking_id=b AND status='RESERVED';
  UPDATE inventory_holds SET status='CONSUMED' WHERE booking_id=b AND status='ACTIVE';
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: trial consume setup failed'; END IF;
  RAISE EXCEPTION 'intentional lifecycle rollback';
 EXCEPTION WHEN raise_exception THEN NULL;
 END;

 IF (SELECT status FROM bookings WHERE id=b)<>'CONFIRMED' THEN RAISE EXCEPTION 'TEST_FAILED: booking status was not rolled back'; END IF;
 IF (SELECT status FROM partner_trial_ledger WHERE booking_id=b)<>'RESERVED' THEN RAISE EXCEPTION 'TEST_FAILED: trial status was not rolled back'; END IF;
 IF (SELECT consumed_at FROM partner_trial_ledger WHERE booking_id=b) IS NOT NULL THEN RAISE EXCEPTION 'TEST_FAILED: trial consumed timestamp was not rolled back'; END IF;
 IF (SELECT status FROM inventory_holds WHERE booking_id=b)<>'ACTIVE' THEN RAISE EXCEPTION 'TEST_FAILED: inventory hold status was not rolled back'; END IF;
END $$;
