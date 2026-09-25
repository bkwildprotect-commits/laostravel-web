# Booking + Partner Trial/Commission Lifecycle

## Booking transitions
- PENDING -> CONFIRMED -> COMPLETED
- PENDING -> CANCELLED
- PENDING -> EXPIRED
- CONFIRMED -> CANCELLED
- CONFIRMED -> NO_SHOW

Terminal states cannot be silently reopened by this domain layer.

## Trial lifecycle
When a booking has a RESERVED free-trial ordinal:
- COMPLETED => CONSUME the ordinal.
- CANCELLED or EXPIRED before completion => RELEASE the ordinal.
- NO_SHOW => CONSUME the ordinal; the Partner provided bookable capacity even though the customer did not arrive.
- Other transitions => no trial change.

This implements the owner rule that a customer cancellation before the booking qualifies must not consume one of the Partner's five free bookings.

## Commission lifecycle
For a COMMISSIONABLE booking:
- PENDING ledger + COMPLETED booking => EARN commission.
- PENDING ledger + CANCELLED/EXPIRED booking => VOID commission.
- Settlement and reversal are separate accounting operations and must be audited.

## Production transaction requirement
Booking status, trial ledger, commission ledger, inventory and audit event must be mutated atomically in the selected PostgreSQL backend. This TypeScript layer defines allowed decisions only; it does not claim that a production database transaction exists yet.

## Locked NO_SHOW rule
NO_SHOW **does consume** one of the Partner’s five free bookings. If a free-trial booking becomes NO_SHOW while its ordinal is RESERVED, the ordinal becomes CONSUMED and is not returned to the free-trial pool.

## Policy still to lock
The exact business event that qualifies as COMPLETED for each service category should be finalized before production launch.
