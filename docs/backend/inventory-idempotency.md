# Inventory Hold + Idempotency

## Inventory hold
A bookable unit/capacity is never deducted only in browser state.

Production flow:
1. Begin PostgreSQL transaction.
2. Lock/version-check the target availability row.
3. Verify requested quantity <= remaining.
4. Create an ACTIVE hold with expiry.
5. Decrement/reserve inventory atomically.
6. Commit.
7. Booking confirmation consumes the hold.
8. Cancellation, payment failure where applicable, or hold timeout releases it exactly once.

The hold TTL is intentionally configurable and not hard-coded until payment/booking mode rules are finalized.

## Idempotency
Every booking-create request requires an idempotency key.
- First valid request stores request hash + resulting response.
- Same key + same request returns the original result, not a second booking.
- Same key + different request is rejected.
- Idempotency is enforced server-side and persisted; browser memory is not sufficient.

## Concurrency
Availability row locking/version checks, hold mutation, booking creation, Partner trial allocation, commission classification and audit event must participate in the required transactional boundary. This prevents two customers from consuming the same last room/seat/unit and prevents one customer retry from creating duplicate bookings.

## Current status
Domain primitives are implemented. Real locking/persistence remains fail-closed until the selected PostgreSQL provider is connected.
