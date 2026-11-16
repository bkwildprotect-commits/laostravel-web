# LaosTravel v2 — Integration / Release Readiness

Scope: source and automated test environments only. This is not production approval.
Contract remains `2026-10-10.v2`; the four owner-approved commercial/payment/inventory rules are unchanged.

| Area | Status | Evidence / remaining gate |
|---|---|---|
| Authentication authorization | Passed in automated tests | Verified provider subject must map to a real ACTIVE internal user. Admin authority is resolved separately. |
| Registration / live login | Blocked | Configure approved provider, email/SMS delivery and callbacks; trusted internal user provisioning remains operational work. No auto-provisioning or role grants added. |
| Session / refresh / local logout | Automated regression coverage | Reject stale generations before dispatch and after response; Mobile isolates overlapping OTP and refresh attempts and account caches. Provider-side session revocation is not implemented by local logout. |
| Partner intake | Automated regression coverage | Authenticated owner/key/hash replay, audit and nationwide intake; intake does not approve evidence or selling. |
| Evidence upload / private storage | Blocked | No connected upload API/provider adapter. Bucket privacy, access policies, reviewer retrieval, retention and deletion require approved infrastructure and testing. Environment readiness flags alone do not prove storage works. |
| Verification / activation | Disposable PostgreSQL coverage | Missing, pending or expired required evidence rejects final approval; six-month activation requires an approved partner and a ready service in an open area. |
| Intercity catalog / quote / booking | Disposable PostgreSQL coverage | Hide inactive services/partners and Bus without verified boarding; price quote then atomic booking, original-key replay and authorized Partner cancellation. |
| Traveller self-cancellation | Blocked | Existing connected clients have no traveller cancellation API/flow; Partner-authorized cancellation is tested. No new endpoint added. |
| Commission / payment | Existing automated regression coverage | COMPLETED + PAID + accepted terms; snapshot stable; refunds/disputes adjust one ledger; REFUNDED is terminal. Payment confirmation is not inferred from booking/check-in. |
| Coupons / Coins redemption | Blocked | Benefits fail closed with BOOKING_BENEFITS_UNAVAILABLE; do not claim successful redemption. Completion earning and duplicate prevention are tested. |
| Verified reviews | Disposable PostgreSQL coverage | Completed booking owner only; concurrent writes create one review. Connected publication/read UI remains untested/unconnected. |
| GPS / SOS / Chat | Backend automated coverage; live client blocked | Synthetic coordinates/messages only; booking ownership, original message preservation and revoked consent tested. Connected Mobile keeps prototype contacts/location/chat unavailable. No emergency calls. |
| Smart Pickup schema | Disposable bootstrap coverage | The current fresh-database bootstrap consumes the complete `scripts/bootstrap-manifest.json`, including `0027_smart_pickup_decision_integrity.sql`, and asserts the decision/label constraints plus the migration-history row. The separate provider-runner test applies the full 36-migration plan to a disposable PostgreSQL database. This is CI evidence only; it does not apply anything to Supabase Provider Staging or enable Smart Pickup UI/route behavior. |
| Shared Contract | Automated regression coverage | Both connected clients and Mobile preflight reject all v2 policy/authority drift before quote/booking. |
| Signing / binary release | Not Tested | Inspect workflow conditions only; APK/AAB/signing/uploads skipped on PR/main events. Do not read or change signing secrets or keys. |
| Live browser/device/provider E2E | Not Tested | Requires an approved staging provider/database/storage and synthetic test accounts. Unit mocks and disposable PostgreSQL are not proof of live acceptance. |
| Production migrations / deployment | Not Tested / prohibited in this round | No production database, real customer data, migration or release used. |

CI acceptance gate: latest PR head must pass every applicable workflow/check before merge, followed by successful main CI. Website CI runs tests/lint/typecheck/build; Database integration runs disposable PostgreSQL bootstrap/mutations/SQL/E2E/concurrency. No artifact upload is added.

Owner decisions remain separate: internal identity provisioning process; evidence access/retention; finer cancellation/resale cutoffs; commercial terms after the free period; settlement/reconciliation of reversed settled commission. No payment gateway, rate or legal policy changed.

## Limited Pilot — Vang Vieng (Readiness Only; Not Authorized)

This section is an operational gate checklist, not approval to expose the service area, enable Booking API, upload Partner evidence, deploy Production, or accept real customers. Vang Vieng remains the only intended initial commercial pilot area; its live booking gate stays closed until separate owner approval.

| Gate | Required evidence before pilot consideration | Current status (2026-11-06) |
|---|---|---|
| Supabase Provider Staging | Correct project ref; verified TLS; reviewed exposed schemas, roles/ACLs, RLS, Storage privacy and Network Restrictions using read-only evidence. | BLOCKED — no current Dashboard/database evidence. |
| Website / Backend Staging | Owner-approved Staging origin; v2 metadata and closed launch gates verified over HTTPS; no Production origin probed. | BLOCKED — no approved Staging origin available. |
| Mobile Staging | Dedicated read-only Staging preflight and physical Android smoke test; no Production release preflight substituted for Staging. | BLOCKED — Mobile Staging preflight PR is pending; no approved origin/device evidence. |
| Partner verification and evidence | Real provider adapter, private evidence access, reviewer retrieval, retention and deletion behavior tested; approval remains server-side and auditable. | BLOCKED — no connected upload API/provider adapter. |
| Booking and inventory | Synthetic-account E2E for request, confirmation, check-in, service and completion; cancellation/expiry, idempotency, concurrency and one-time eligible inventory restoration verified against Provider Staging. | BLOCKED — current evidence is Disposable PostgreSQL only. |
| Payment and commission | Payment remains separate from booking status; PAY_AT_PARTNER is direct Partner payment; LAUNCH_FREE is 0%; post-expiry commission requires separately accepted terms and an active versioned rule; refund/dispute ledger behavior verified. | BLOCKED — automated regression coverage only; no live Provider E2E. |
| Governance and audit | Required CI checks enforced before merge; material booking, payment, verification, commission, settlement and area changes auditable. | BLOCKED — main branches currently report protection=false and required-check enforcement=off. |
| Owner acceptance | Written, scope-specific approval for the pilot cohort, area activation, operational support and rollback. | NOT GRANTED. |

### Pilot sequence

1. **Closed technical validation:** read-only Provider/Staging checks and synthetic test accounts only. Booking API and Partner Evidence Upload remain disabled.
2. **Internal dry run:** only after Provider Staging, private evidence, Website and Mobile connectivity, and full booking/payment/commission E2E pass. Use synthetic/internal accounts; do not accept customer funds or real customer bookings.
3. **Limited customer pilot:** a separate explicit owner approval is required before any audited Admin action opens Vang Vieng commercial booking or any real customer/Partner transaction is accepted. Scope must remain limited to approved, verified Partners and bookable services in that area.

### Contract controls that must remain unchanged

- Six calendar months of LAUNCH_FREE begins only at qualifying audited commercial activation, not signup or lead creation.
- CHECKED_IN does not imply PAID; payment truth remains backend-owned.
- Commission is not automatically activated when LAUNCH_FREE expires.
- Inventory is restored only for eligible unused future capacity and at most once; CHECKED_IN, IN_SERVICE and NO_SHOW do not qualify for automatic restoration.
- No client-side price, inventory, Partner eligibility, payment or commission authority.
- No Pay-to-Rank, hidden fees, fake reviews or unlabelled advertising.

Passing this checklist does not itself authorize launch. The final pilot decision remains an owner-only action after every applicable gate has current evidence.
