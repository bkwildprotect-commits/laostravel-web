# Backend Safety Test Matrix

Normative product and commercial rules: `docs/SHARED_PRODUCT_CONTRACT.md`, version `2026-10-10.v2`.

This matrix separates current v2 behavior from legacy `TRIAL_FREE` compatibility. Legacy ordinal tests are not acceptance evidence for new Partner eligibility.

| Domain | Automated coverage on current `main` | Provider Staging acceptance still required |
|---|---|---|
| Partner verification and commercial activation | Disposable PostgreSQL mutation tests reject activation without a bookable service; require an APPROVED Partner, active service, booking-enabled area, effective price and future capacity; verify a single six-calendar-month `LAUNCH_FREE` period. | Verify the same activation and immutable terms/audit evidence against the approved Staging provider using synthetic identities and services. |
| Booking, quote and idempotency | PostgreSQL mutation tests exercise authoritative quote-to-booking, concurrent identical-request replay, changed-payload conflict and concurrent booking requests. | Verify live auth mapping, quote ownership/expiry, same-key replay and server-issued booking reference. |
| Inventory | PostgreSQL mutation tests exercise no-oversell concurrency, exactly-once restoration of eligible future capacity, and fail-closed restoration for ineligible capacity/state. | Verify real provider locking/transactions and audit effects with disposable Staging inventory; no customer inventory. |
| Payment status | PostgreSQL mutation tests exercise payment transitions independently from booking completion, including invalid transitions. | Verify the approved `PAY_AT_PARTNER` operational confirmation path; check-in, QR display or client evidence must never set `PAID`. |
| Commission and settlement | PostgreSQL mutation tests require `COMPLETED + PAID` and accepted terms, cover payment-before-completion, dispute/refund behavior, missing terms and settlement/refund concurrency. | Verify versioned rule/terms snapshots, one ledger per booking, audit trail and manual reconciliation boundaries in Staging. |
| Rewards | PostgreSQL mutation tests exercise concurrent completion reward requests and duplicate prevention. | Benefits redemption remains fail-closed until its authoritative provider path is approved and connected. |
| Legacy `TRIAL_FREE` | SQL integration checks 001, 002, 007 and 008 preserve historical five-ordinal records and lifecycle compatibility. | These checks must not be used to qualify new bookings or consume the current six-month entitlement. Confirm new booking rows use `LAUNCH_FREE` or separately accepted `COMMISSIONABLE`. |
| Live provider/device acceptance | Not established by disposable PostgreSQL or mocked/unit tests. | Requires approved Staging host, Auth/SMS, private storage, synthetic accounts and real-device E2E. |

A passing CI run proves only the automated disposable test scope. It does not prove Supabase Provider Staging, live Auth/SMS, private Evidence Storage, deployed Backend connectivity or production readiness.
