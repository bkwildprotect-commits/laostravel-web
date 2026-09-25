-- psql variables required: partner_id, user_id, booking_id, ordinal
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
INSERT INTO bookings(id,booking_ref,user_id,status) VALUES (:'booking_id'::uuid,'CONC-'||:'booking_id',:'user_id'::uuid,'PENDING');
INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES (:'booking_id'::uuid,:'partner_id'::uuid,'TRIAL_FREE');
INSERT INTO partner_trial_ledger(id,partner_id,booking_id,trial_ordinal,status) VALUES (gen_random_uuid(),:'partner_id'::uuid,:'booking_id'::uuid,:'ordinal'::smallint,'RESERVED');
COMMIT;
