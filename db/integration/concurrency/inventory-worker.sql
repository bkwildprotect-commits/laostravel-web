-- psql variables: availability_id, quantity
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT remaining FROM availability WHERE id=:'availability_id'::uuid FOR UPDATE;
UPDATE availability
SET remaining=remaining-:'quantity'::integer, version=version+1
WHERE id=:'availability_id'::uuid
  AND remaining IS NOT NULL
  AND remaining>=:'quantity'::integer;
\if :{?expected_rows}
\endif
COMMIT;
