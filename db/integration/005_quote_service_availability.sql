-- Disposable PostgreSQL only: quote service and availability must match.
DO $$
DECLARE p uuid:=gen_random_uuid(); s1 uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); rejected boolean:=false;
BEGIN
 INSERT INTO partners(id,name) VALUES(p,'Integrity Test Partner');
 INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES(s1,p,'TOUR','ACTIVE','CAPACITY'),(s2,p,'TOUR','ACTIVE','CAPACITY');
 INSERT INTO availability(id,service_id,remaining,version) VALUES(a,s1,1,1);
 BEGIN
  INSERT INTO price_quotes(id,service_id,availability_id,service_date,quantity,availability_token,currency,base_amount,customer_total,expires_at) VALUES(q,s2,a,current_date,1,'mismatch-'||q,'LAK',100000,100000,now()+interval '10 minutes');
 EXCEPTION WHEN foreign_key_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'TEST_FAILED: mismatched quote accepted'; END IF;
END $$;
