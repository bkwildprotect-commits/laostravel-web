# Concrete PostgreSQL booking repository contract

## Finite inventory reservation

The production repository must execute the availability read and decrement inside the same SERIALIZABLE booking transaction.

1. Lock the availability row with SELECT ... FOR UPDATE.
2. Validate service/date/option/quote binding in server code against the locked row.
3. For finite inventory, decrement only with a guarded UPDATE where remaining >= requested quantity.
4. Require exactly one updated row. Zero rows means unavailable/conflict and the transaction must not create a booking.
5. Increment availability.version on every inventory mutation.
6. Unlimited inventory is represented by remaining IS NULL and must not be decremented.
7. Create/attach inventory hold and booking records only in the same transaction after successful reservation.
8. On any later failure, roll back the whole transaction.

Never use read-then-write outside one database transaction. Never trust client-side remaining inventory.

## SQL shape

SELECT remaining, version, service_id, starts_at, ends_at
FROM availability
WHERE id=$1
FOR UPDATE;

UPDATE availability
SET remaining=remaining-$2, version=version+1
WHERE id=$1 AND remaining IS NOT NULL AND remaining >= $2
RETURNING remaining, version;

The concrete adapter must treat no RETURNING row as insufficient inventory.

## Concurrency pass condition

With remaining=1 and two independent clients each requesting quantity=1, exactly one reservation may commit and final remaining must be 0, never negative.
