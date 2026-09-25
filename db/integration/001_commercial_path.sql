-- Run only in a disposable PostgreSQL integration database.
BEGIN;
DO $$
DECLARE p uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); t uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
BEGIN
 INSERT INTO users(id,email) VALUES(u,'dbtest-'||u||'@example.invalid');
 INSERT INTO partners(id,name) VALUES(p,'DB Test Partner');
 INSERT INTO bookings(id,booking_ref,user_id,status) VALUES(b,'DBT-'||b,u,'PENDING');
 INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES(b,p,'TRIAL_FREE');
 INSERT INTO partner_trial_ledger(id,partner_id,booking_id,trial_ordinal,status) VALUES(t,p,b,1,'RESERVED');
 BEGIN
  INSERT INTO partner_commission_ledger(id,partner_id,booking_id,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version)
  VALUES(c,p,b,'PENDING','LAK',10000,1000,1000,9000,'db-test');
  RAISE EXCEPTION 'TEST_FAILED: opposite commission path was accepted';
 EXCEPTION WHEN foreign_key_violation OR check_violation THEN NULL;
 END;
END $$;
ROLLBACK;
