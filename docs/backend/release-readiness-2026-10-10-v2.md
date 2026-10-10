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
| Smart Pickup schema | Disposable bootstrap coverage | Apply the previously omitted 0027_smart_pickup_decision_integrity migration; assert decision and label constraints. Does not enable pickup UI or fabricate route data. |
| Shared Contract | Automated regression coverage | Both connected clients and Mobile preflight reject all v2 policy/authority drift before quote/booking. |
| Signing / binary release | Not Tested | Inspect workflow conditions only; APK/AAB/signing/uploads skipped on PR/main events. Do not read or change signing secrets or keys. |
| Live browser/device/provider E2E | Not Tested | Requires an approved staging provider/database/storage and synthetic test accounts. Unit mocks and disposable PostgreSQL are not proof of live acceptance. |
| Production migrations / deployment | Not Tested / prohibited in this round | No production database, real customer data, migration or release used. |

CI acceptance gate: latest PR head must pass every applicable workflow/check before merge, followed by successful main CI. Website CI runs tests/lint/typecheck/build; Database integration runs disposable PostgreSQL bootstrap/mutations/SQL/E2E/concurrency. No artifact upload is added.

Owner decisions remain separate: internal identity provisioning process; evidence access/retention; finer cancellation/resale cutoffs; commercial terms after the free period; settlement/reconciliation of reversed settled commission. No payment gateway, rate or legal policy changed.
