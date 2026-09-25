# Coupon and Points Transaction Invariants

Coupon claim and points redemption execute inside the same SERIALIZABLE booking transaction as inventory and booking creation.

- Lock the user's points balance before checking and redeeming points.
- Points are ledger entries, never a mutable client balance.
- A redemption is linked to one booking and must be unique for that booking/type.
- Coupon eligibility and benefit are server-authoritative.
- Coupon usage is claimed transactionally; a duplicate or already-used entitlement fails the transaction.
- Idempotency is claimed before rewards mutation, so a retried identical request must replay rather than deduct again.
- Any failure rolls back inventory, rewards, trial/commission allocation, booking and audit writes together.
