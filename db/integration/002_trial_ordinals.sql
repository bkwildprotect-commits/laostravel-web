-- Verifies that only five occupied trial ordinals can coexist for one partner.
BEGIN;
DO $$
DECLARE p uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); b uuid; i int;
BEGIN
 INSERT INTO users(id,email) VALUES(u,'trialtest-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'Trial Test Partner');
 FOR i IN 1..5 LOOP
  b:=gen_random_uuid();
  INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'TRIAL-'||b,u,'PENDING');
  INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
  INSERT INTO partner_trial_ledger(id,partner_id,booking_id,trial_ordinal,status) VALUES(gen_random_uuid(),p,b,i,'RESERVED');
 END LOOP;
 b:=gen_random_uuid();
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'TRIAL-X-'||b,u,'PENDING');
 INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
 BEGIN
  INSERT INTO partner_trial_ledger(id,partner_id,booking_id,trial_ordinal,status) VALUES(gen_random_uuid(),p,b,5,'RESERVED');
  RAISE EXCEPTION 'TEST_FAILED: duplicate occupied ordinal was accepted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
END $$;
ROLLBACK;
