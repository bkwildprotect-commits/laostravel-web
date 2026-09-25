# Payment, Trial and Commission Boundary

Payment does not earn Partner commission by itself.

At booking allocation, exactly one commercial path is attached:
1. TRIAL_FREE: reserve one of ordinals 1-5; no commission ledger for that booking.
2. COMMISSIONABLE: create a PENDING commission ledger; no trial reservation.

Lifecycle:
- TRIAL_FREE + COMPLETED -> CONSUMED.
- TRIAL_FREE + CANCELLED / EXPIRED / NO_SHOW -> RELEASED. NO_SHOW does not consume one of the five free bookings.
- COMMISSIONABLE + COMPLETED -> EARNED.
- COMMISSIONABLE + CANCELLED / EXPIRED -> VOID.
- COMMISSIONABLE + NO_SHOW -> no automatic commission transition until the owner approves that policy.

PAID, AUTHORIZED, PAY_AT_PARTNER and other payment states never independently consume a trial slot or earn commission. This separation prevents duplicate revenue mutations when payment callbacks are retried.

Database uniqueness on booking_id in the trial and commission ledgers prevents duplicate rows within each path; the concrete transaction repository must additionally enforce mutual exclusivity while holding the Partner allocation lock.
