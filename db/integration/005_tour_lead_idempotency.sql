\set ON_ERROR_STOP on
DO $$
DECLARE
  lead_id uuid := '00000000-0000-4000-8000-000000000101';
  existing_hash text;
BEGIN
  INSERT INTO tour_leads(id,submission_key,request_hash,name,phone,email,requested_date,guests,consent)
  VALUES(lead_id,'integration-submission-0001','hash-a','Integration User','+8562012345678','integration@example.com','2026-10-20',2,true);

  INSERT INTO tour_leads(id,submission_key,request_hash,name,phone,email,requested_date,guests,consent)
  VALUES('00000000-0000-4000-8000-000000000102','integration-submission-0001','hash-a','Integration User','+8562012345678','integration@example.com','2026-10-20',2,true)
  ON CONFLICT (submission_key) DO NOTHING;

  IF (SELECT count(*) FROM tour_leads WHERE submission_key='integration-submission-0001') <> 1 THEN
    RAISE EXCEPTION 'tour lead idempotency unique invariant failed';
  END IF;

  SELECT request_hash INTO existing_hash FROM tour_leads WHERE submission_key='integration-submission-0001';
  IF existing_hash <> 'hash-a' THEN RAISE EXCEPTION 'tour lead request hash changed unexpectedly'; END IF;
END $$;
