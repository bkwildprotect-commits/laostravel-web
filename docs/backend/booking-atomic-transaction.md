# Atomic Booking Transaction

The production booking write must be one server-controlled PostgreSQL transaction.

## Required order
1. Begin transaction at a concurrency-safe isolation/locking level.
2. Claim authenticated user + idempotency key.
3. Lock service/availability scope.
4. Revalidate availability token, quote ID, expiry, inventory and server price.
5. Reserve inventory / create ACTIVE hold.
6. Lock Partner trial entitlement.
7. If an ordinal 1-5 is available, reserve it; otherwise create a PENDING commission snapshot using the active versioned rule.
8. Create booking + booking item + immutable price snapshot.
9. Attach/consume the hold as required by the booking/payment mode.
10. Write audit event.
11. Mark idempotency result COMPLETED with booking ID.
12. Commit.

## Failure
Any failure before commit rolls the transaction back. It must not consume a trial slot, earn commission, or leave phantom inventory reserved.

## Later lifecycle
- COMPLETED trial booking => CONSUMED.
- CANCELLED / EXPIRED / NO_SHOW trial booking before qualification => RELEASED.
- COMPLETED commissionable booking => commission EARNED.
- CANCELLED / EXPIRED commissionable booking before earning => commission VOID.
- Settlement is separate and audited.

## Security
The browser/mobile client never supplies authoritative price, commission classification, trial ordinal, inventory remaining, or booking status.

This document is provider-neutral. Real SQL transaction implementation follows after the PostgreSQL provider is selected and connected.
