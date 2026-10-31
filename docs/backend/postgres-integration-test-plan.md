# PostgreSQL v2 integration acceptance plan

Normative business and commercial contract: `docs/SHARED_PRODUCT_CONTRACT.md`, version `2026-10-10.v2`.

This plan describes disposable PostgreSQL verification. It is not approval to connect to or modify Supabase Provider Staging or Production.

## Current disposable CI path

The Database Integration workflow creates a local disposable `laostravel_test` database, applies the repository bootstrap manifest, runs RLS/client-isolation checks, executes `db/integration/production-mutations.test.ts`, runs SQL compatibility checks and exercises multi-connection concurrency. The guarded runner accepts only the local disposable database.

## Current v2 acceptance gates

1. Partner activation fails unless verification is APPROVED and a real ACTIVE service has an effective price offer, future capacity and a `BOOKING_ENABLED` service area.
2. Successful commercial activation starts exactly six calendar months of individual `LAUNCH_FREE`; booking count does not consume or shorten the period, and repeat activation is rejected.
3. Expiry never silently enables commission. A separately accepted `COMMISSION` term and an active effective versioned rule are required; otherwise booking allocation fails closed.
4. Booking lifecycle and payment status remain independent. Check-in, QR display, receipt upload or client callbacks do not establish `PAID`.
5. Commission earns only when the booking is `COMPLETED`, payment is `PAID`, and nonblank accepted commercial-terms evidence was snapshotted. Payment-before-completion must remain pending until completion commits.
6. `REFUNDED` is terminal; `REFUNDED → DISPUTED` is rejected. Dispute/refund transitions must not create a second commission ledger or automatic money transfer.
7. Inventory reservation is atomic under concurrent requests and never oversells. Eligible future capacity is restored exactly once; past/unknown capacity, closed/inactive services, CHECKED_IN/IN_SERVICE and NO_SHOW do not receive automatic inventory credit.
8. Identical idempotency retries return the original booking; changed payload under the same key conflicts.
9. Booking, payment, commission, activation and settlement mutations preserve their required audit records and immutable snapshots.

## Legacy compatibility checks

SQL files `001_commercial_path.sql`, `002_trial_ordinals.sql`, `007_booking_trial_e2e.sql` and the legacy portion of `008_booking_trial_rollback.sql` exercise the historical `TRIAL_FREE` five-booking/ordinal model. They remain compatibility checks for existing historical rows only. They are not the current commercial policy and must not be interpreted as evidence that new bookings receive five free bookings or become commissionable on booking six.

New v2 bookings use `partner_commercial_terms`: `LAUNCH_FREE` during the Partner's individual six-calendar-month window, or `COMMISSIONABLE` only after separately accepted terms and an active versioned rule. Legacy lifecycle code may continue to preserve existing `partner_trial_ledger` rows; it must not allocate new v2 bookings to `TRIAL_FREE`.

## Pass criteria

- All current v2 mutation and concurrency assertions pass on a fresh disposable database.
- No negative inventory, duplicate booking/ledger/reward, premature commission, silent commission activation or duplicate inventory restoration occurs.
- Legacy compatibility tests pass without being treated as current commercial eligibility.
- Provider Staging remains a separate gate: verified target/TLS, owner-controlled access, Schema/RLS/Storage review, synthetic accounts and live E2E are still required.

Do not run the Provider Staging runner with `--apply` or apply real migrations without separate exact-plan owner approval. Never use this disposable CI workflow against Supabase or Production.
