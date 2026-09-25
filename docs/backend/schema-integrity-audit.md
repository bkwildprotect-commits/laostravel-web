# Schema integrity audit

Audit completed before first production database deployment.

Corrections:
- Removed the duplicate inventory_holds declaration from the reference schema.
- Removed the legacy generic idempotency_records block from the reference schema; booking_idempotency remains the booking-specific foundation.
- Coupon usage no longer has a global UNIQUE(user_id,coupon_id) rule. Coupon reuse/loop policy is unresolved and must remain versioned server policy.
- Points ledger uniqueness is limited to REDEEM per user/booking. REVERSAL and ADJUSTMENT history must remain appendable.
- Coupon benefit amounts and points amounts have non-negative/positive database checks.

Migration 0002 was revised because migrations have not been applied to production. If any environment has already applied an older 0002, do not overwrite history there; create a corrective forward migration instead.

Remaining pre-production work:
- Reconcile the reference schema with migrations 0001-0004 as one clean bootstrap path.
- Execute migrations against an approved disposable PostgreSQL environment and test rollback/restore.
- Verify commercial-path concurrency and inventory locking with real concurrent database transactions.
