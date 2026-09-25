# Inventory Hold + Idempotency Foundation

Prevents overselling and duplicate bookings.

- Holds are created server-side inside the inventory transaction.
- ACTIVE holds reserve capacity until consumed, released, or expired.
- Client clocks are never authoritative.
- Cancellation, expiry, failed required payment, or quote expiry releases capacity when applicable.
- Booking creation requires an idempotency key scoped to the authenticated user and canonical request hash.
- Same key + same successful request replays the original result.
- Same key + different request is a conflict.
- PROCESSING prevents a second concurrent transaction.
- PostgreSQL locking/serializable protection is required around inventory, trial allocation, booking creation, and idempotency.
