-- Disposable PostgreSQL only: prove lifecycle side effects roll back atomically.
-- Trial and commission are separate scenarios because one booking can use only one commercial path.
DO $$
DECLARE
 p uuid:=gen_random_uuid();u uuid:=gen_random_uuid();s uuid:=gen_random_uuid();a uuid:=gen_random_uuid();
 b uuid:=gen_random_uuid();t uuid:=gen_random_uuid();h uuid:=gen_random_uuid();
 b2 uuid:=gen_random_uuid();c uuid:=gen_random_uuid();h2 uuid:=gen_random_uuid();
BEGIN
 INSERT INTO users(id,email) VALUES(u,'lifecycle-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'Lifecycle Rollback Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s,2,1);

 -- Trial path: booking + trial + inventory must all roll back.
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'LCR-T-'||b,u,'CONFIRMED');
 INSERT INTO booking_items(id,booking_id,service_id,availability_id,quantity) VALUES(gen_random_uuid(),b,s,a,1);
 INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
 INSERT INTO partner_trial_ledger(id,partner_id,booking_id,commercial_path,trial_ordinal,status) VALUES(t,p,b,'TRIAL_FREE',1,'RESERVED');
 INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) VALUES(h,s,a,b,1,'ACTIVE',now()+interval '15 minutes');

 BEGIN
  UPDATE bookings SET status='COMPLETED' WHERE id=b;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: trial booking setup failed'; END IF;
  UPDATE partner_trial_ledger SET status='CONSUMED',consumed_at=now(),released_at=NULL WHERE booking_id=b AND status='RESERVED';
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: trial ledger setup failed'; END IF;
  UPDATE inventory_holds SET status='CONSUMED' WHERE booking_id=b AND status='ACTIVE';
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: trial inventory setup failed'; END IF;
  RAISE EXCEPTION USING ERRCODE='LT001',MESSAGE='intentional trial lifecycle rollback';
 EXCEPTION WHEN SQLSTATE 'LT001' THEN NULL;
 END;

 IF (SELECT status FROM bookings WHERE id=b)<>'CONFIRMED' THEN RAISE EXCEPTION 'TEST_FAILED: trial booking status was not rolled back'; END IF;
 IF (SELECT status FROM partner_trial_ledger WHERE booking_id=b)<>'RESERVED' THEN RAISE EXCEPTION 'TEST_FAILED: trial status was not rolled back'; END IF;
 IF (SELECT consumed_at FROM partner_trial_ledger WHERE booking_id=b) IS NOT NULL THEN RAISE EXCEPTION 'TEST_FAILED: trial consumed timestamp was not rolled back'; END IF;
 IF (SELECT status FROM inventory_holds WHERE booking_id=b)<>'ACTIVE' THEN RAISE EXCEPTION 'TEST_FAILED: trial inventory hold was not rolled back'; END IF;

 -- Commission path: booking + commission + inventory must all roll back.
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b2,'LCR-C-'||b2,u,'CONFIRMED');
 INSERT INTO booking_items(id,booking_id,service_id,availability_id,quantity) VALUES(gen_random_uuid(),b2,s,a,1);
 INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b2,p,'COMMISSIONABLE');
 INSERT INTO partner_commission_ledger(
  id,partner_id,booking_id,commercial_path,status,currency,commission_basis_amount,
  commission_rate_bps,commission_amount,partner_amount,commission_rule_version
 ) VALUES(c,p,b2,'COMMISSIONABLE','PENDING','LAK',100000,1000,10000,90000,'integration-v1');
 INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) VALUES(h2,s,a,b2,1,'ACTIVE',now()+interval '15 minutes');

 BEGIN
  UPDATE bookings SET status='COMPLETED' WHERE id=b2;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: commission booking setup failed'; END IF;
  UPDATE inventory_holds SET status='CONSUMED' WHERE booking_id=b2 AND status='ACTIVE';
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: commission inventory setup failed'; END IF;
  UPDATE partner_commission_ledger SET status='EARNED',earned_at=now() WHERE booking_id=b2 AND status='PENDING';
  IF NOT FOUND THEN RAISE EXCEPTION 'TEST_FAILED: commission ledger setup failed'; END IF;
  RAISE EXCEPTION USING ERRCODE='LT002',MESSAGE='intentional commission lifecycle rollback';
 EXCEPTION WHEN SQLSTATE 'LT002' THEN NULL;
 END;

 IF (SELECT status FROM bookings WHERE id=b2)<>'CONFIRMED' THEN RAISE EXCEPTION 'TEST_FAILED: commission booking status was not rolled back'; END IF;
 IF (SELECT status FROM partner_commission_ledger WHERE booking_id=b2)<>'PENDING' THEN RAISE EXCEPTION 'TEST_FAILED: commission status was not rolled back'; END IF;
 IF (SELECT earned_at FROM partner_commission_ledger WHERE booking_id=b2) IS NOT NULL THEN RAISE EXCEPTION 'TEST_FAILED: commission earned timestamp was not rolled back'; END IF;
 IF (SELECT status FROM inventory_holds WHERE booking_id=b2)<>'ACTIVE' THEN RAISE EXCEPTION 'TEST_FAILED: commission inventory hold was not rolled back'; END IF;
END $$;
