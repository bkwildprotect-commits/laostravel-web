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
| Signing / binary release | Staging Debug path merged; binary not built | Mobile PR #58 added an owner-gated, manual Staging Debug APK path using only Android debug signing and Staging public configuration. Main run `45025310654` passed routine source/tests, but Staging configuration validation, GET-only preflight, APK build and artifact upload were skipped; no artifact was produced. The Production Release path remains separate, uses Production-backend preflight/signing secrets, and its APK upload remains hard-disabled. Do not read or change signing secrets or keys. |
| Live browser/device/provider E2E | Not Tested | Requires an approved staging provider/database/storage and synthetic test accounts. Unit mocks and disposable PostgreSQL are not proof of live acceptance. |
| Production migrations / deployment | Not Tested / prohibited in this round | No production database, real customer data, migration or release used. |

CI acceptance gate: latest PR head must pass every applicable workflow/check before merge, followed by successful main CI. Website CI runs tests/lint/typecheck/build; Database integration runs disposable PostgreSQL bootstrap/mutations/SQL/E2E/concurrency. No artifact upload is added.

Owner decisions remain separate: internal identity provisioning process; evidence access/retention; finer cancellation/resale cutoffs; commercial terms after the free period; settlement/reconciliation of reversed settled commission. No payment gateway, rate or legal policy changed.


## Verification snapshot — 2026-11-25

- Repository metadata was re-read for both projects. Website is Public and Mobile remains Private; both default to `main`, and the connected account reports admin/push permissions. The latest Main commits are unchanged from the prior snapshot: Website `2e97047d73f4da0ea3d94fc6937aaf8f05950aa2` and Mobile `9fdb2723fb86d71023a8ffc2b9a7eba7061ffad7`. Commit comparison from each recorded SHA to the current head is identical (zero ahead/behind commits). No open PRs were returned for either repository.
- Website Main CI run #606 (`45179373016`) was rechecked at job/step level: `test-and-build` completed successfully, including domain tests, Staging runner/smoke safeguard tests, lint, TypeScript check and website build. Database Integration #414 (`45179373106`) completed successfully on disposable PostgreSQL, including fresh-database bootstrap, RLS/client-isolation tests, provider-runner tests, v2 booking/payment/commission/reward mutations and concurrency checks. This is not Supabase Provider Staging acceptance.
- The Website Main commit's GitHub combined status currently reports Vercel `success`. The linked Vercel deployment environment (Preview vs Production) is not established by that status and remains owner-review only; no deployment or environment setting was changed.
- Mobile Main CI run #312 (`45179853667`) was rechecked at job/step level: Flutter Analyze, Flutter Test, backend preflight tests, workflow guard and public configuration checks passed. Staging configuration validation, Staging GET preflight, Staging Debug APK build, APK upload, Release APK and AAB steps were skipped. The workflow-run artifact list is empty; no APK was generated. The available connected Actions functions can inspect this known run but do not provide a complete latest-run listing, so this record does not assert that no later manual dispatch exists.
- Current Mobile Staging files were fetched directly: `.github/workflows/staging-readiness.yml` SHA `75e25f3a2f0e4aaf5509403b1dc99ae212a75699`; `.github/workflows/build-apk.yml` SHA `9ab91062c579379e4e375947420e7f17106de8a8`; `tool/staging_backend_preflight.py` SHA `815ba1fb87119578043cf167142a294a88931f92`. The readiness probe remains manual-only, `contents: read`, unauthenticated HTTPS GET, redirects rejected, and off unless explicitly selected. The Debug APK path remains owner-dispatched and Staging-only; it requires approved non-secret Variables and successful read-only preflight before debug signing/build.
- Current Website safeguards were fetched directly: `scripts/staging-smoke.mjs` SHA `119d8a746f32a540adda3b1a272c7ea2140133b4`; `scripts/staging-bootstrap.mjs` SHA `1e38b09a548b3358eb1a5322e330e0c9b78d40fa`. The smoke check uses unauthenticated GET, omits credentials, rejects redirects and checks v2 metadata, closed Booking/Partner Evidence gates and anonymous-session rejection. The bootstrap runner's `--check` path uses a read-only transaction; `--apply` remains prohibited in this work.
- Supabase Auth Health was checked again on 2026-11-25 using unauthenticated HTTPS GET. DNS resolution failed (`curl: (6) Could not resolve host`; HTTP 000). This is an access failure from the verification environment and does not establish a Supabase Project outage. No credentials were used and no Supabase setting or database was changed.
- GitHub repository metadata confirms Website Public and Mobile Private, but the currently available connected functions do not expose a fresh branch-protection/ruleset read. The last successful branch-protection read retained in prior evidence (2026-11-21) reported classic protection disabled for both Main branches; treat enforcement as not currently verified and keep the Governance gate FAIL/BLOCKED pending owner inspection. No repository visibility, plan, branch-protection or ruleset setting was changed.
- The Bootstrap manifest was fetched directly and remains SHA `25af11dff0fc467f2d063e4c7f2bd6808fbc9249`: 37 entries (one schema file and 36 SQL migrations). The duplicate numeric prefixes `0025` and `0027` are distinct filenames already present in the manifest. No Bootstrap `--apply`, Provider migration or Production migration was run.

## Limited Pilot — Vang Vieng (Readiness Only; Not Authorized)

This section is an operational gate checklist, not approval to expose the service area, enable Booking API, upload Partner evidence, deploy Production, or accept real customers. Vang Vieng remains the only intended initial commercial pilot area; its live booking gate stays closed until separate owner approval.

| Gate | Required evidence before pilot consideration | Current status (verification snapshot 2026-11-25) |
|---|---|---|
| Supabase Provider Staging | Correct project ref; verified TLS; reviewed exposed schemas, roles/ACLs, RLS, Storage privacy and Network Restrictions using read-only evidence. | BLOCKED — no current Dashboard/database evidence; unauthenticated Auth Health GET failed DNS resolution from the verification environment on 2026-11-25, which does not establish a Project outage. |
| Website / Backend Staging | Owner-approved Staging origin; v2 metadata and closed launch gates verified over HTTPS; no Production origin probed. | BLOCKED — Website Main CI #606 and Database Integration #414 passed on recorded Main `2e97047d73f4da0ea3d94fc6937aaf8f05950aa2`; Vercel status is success but its environment is unverified. No owner-approved Staging origin or Provider HTTPS acceptance is available. |
| Mobile Staging | Dedicated read-only Staging preflight and physical Android smoke test; no Production release preflight substituted for Staging. | BLOCKED — Mobile Main CI #312 passed source/tests, but Staging validation, GET probe and Debug APK build were skipped; artifact list is empty. No owner-approved origins, successful live probe, APK artifact or physical Android smoke-test evidence. |
| Partner verification and evidence | Real provider adapter, private evidence access, reviewer retrieval, retention and deletion behavior tested; approval remains server-side and auditable. | BLOCKED — no connected upload API/provider adapter. |
| Booking and inventory | Synthetic-account E2E for request, confirmation, check-in, service and completion; cancellation/expiry, idempotency, concurrency and one-time eligible inventory restoration verified against Provider Staging. | BLOCKED — current evidence is Disposable PostgreSQL only. |
| Payment and commission | Payment remains separate from booking status; PAY_AT_PARTNER is direct Partner payment; LAUNCH_FREE is 0%; post-expiry commission requires separately accepted terms and an active versioned rule; refund/dispute ledger behavior verified. | BLOCKED — automated regression coverage only; no live Provider E2E. |
| Governance and audit | Required CI checks enforced before merge; material booking, payment, verification, commission, settlement and area changes auditable. | FAIL / BLOCKED — current connected functions do not expose a fresh branch-protection/ruleset read. The last successful branch-protection read retained from 2026-11-21 reported classic protection off for both repositories. Current enforcement remains unverified; owner inspection is required. |
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
