-- psql variables: availability_id, quantity
\set ON_ERROR_STOP on
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT remaining FROM availability WHERE id=:'availability_id'::uuid FOR UPDATE;
WITH reserved AS (
 UPDATE availability
 SET remaining=remaining-:'quantity'::integer, version=version+1
 WHERE id=:'availability_id'::uuid
   AND remaining IS NOT NULL
   AND remaining>=:'quantity'::integer
 RETURNING 1
)
SELECT 1 / CASE WHEN count(*)=1 THEN 1 ELSE 0 END AS reservation_assertion FROM reserved;
COMMIT;
