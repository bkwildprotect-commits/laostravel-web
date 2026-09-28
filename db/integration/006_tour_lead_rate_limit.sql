\set ON_ERROR_STOP on
DO $$
DECLARE
  i integer;
  observed integer;
  window_start timestamptz := '2026-09-28 00:00:00+00';
BEGIN
  FOR i IN 1..6 LOOP
    INSERT INTO tour_lead_rate_limits(rate_key,window_started_at,request_count)
    VALUES('integration:tour-lead-rate',window_start,1)
    ON CONFLICT(rate_key,window_started_at) DO UPDATE
      SET request_count=tour_lead_rate_limits.request_count+1,updated_at=NOW()
    RETURNING request_count INTO observed;
    IF observed <> i THEN RAISE EXCEPTION 'atomic rate counter expected %, got %',i,observed; END IF;
  END LOOP;
  IF (SELECT request_count FROM tour_lead_rate_limits WHERE rate_key='integration:tour-lead-rate' AND window_started_at=window_start) <> 6 THEN
    RAISE EXCEPTION 'durable rate counter final value mismatch';
  END IF;
END $$;
