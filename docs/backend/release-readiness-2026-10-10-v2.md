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


## Verification snapshot — 2026-11-23

- Website Main remains `340b0160bf4f2e6c4d1e818a8a8c4907764d2f2b`. Its latest Main Website CI run `44906695965` (#602) and Database Integration run `44906696033` (#410) completed successfully; the Vercel commit status for this SHA is `success`. There are no open Website PRs. The Main commit is documentation-only and has no runtime, schema, migration, payment or business-rule change.
- The Database Integration run bootstraps and mutates disposable PostgreSQL only. It is not evidence of Supabase Provider Staging acceptance.
- Mobile Main is `c5a4a986a61892d4099e076d73fa354cb64391e5`, the merge commit for PR #58 on 2026-11-22. PR #58 changed only `.github/workflows/build-apk.yml` and `test/staging_debug_apk_workflow_test.py`; it adds an owner-gated Staging Debug APK path and a static workflow guard, with no app runtime, schema, migration, payment or business-rule change. The latest PR-head run `44973027662` (#307, head `f67ee2bd35dd949e2f7a0b5c19d009f3e4770350`) passed. An earlier superseded head run #306 failed; the updated head passed before merge.
- Mobile post-merge Main run `45025310654` (#308) completed successfully. Flutter Analyze, Flutter Test and backend preflight tests passed. The Staging configuration validation, Staging GET-only preflight, Debug APK build and artifact upload steps were all skipped because the manual input was not selected. The run has zero artifacts; no APK was generated.
- The Staging Debug APK path is manual-only and defaults to `build_staging_debug_apk=false`. Before dispatch it requires owner-configured public variables: `LAOSTRAVEL_STAGING_ENVIRONMENT=staging`, `LAOSTRAVEL_STAGING_BACKEND_URL`, `LAOSTRAVEL_STAGING_APPROVED_ORIGIN`, `LAOSTRAVEL_BACKEND_URL` (release origin), `LAOSTRAVEL_STAGING_SUPABASE_URL` (must match `https://fnsszfomslvpxghjukid.supabase.co`), and `LAOSTRAVEL_STAGING_SUPABASE_PUBLISHABLE_KEY` (publishable key or legacy anon JWT only). It requires the Staging origin to match the approved origin and differ from the release origin. It then performs unauthenticated HTTPS GET checks for Shared Contract v2 metadata, closed launch gates and anonymous-session rejection, rejects redirects, and only then builds a debug-signed APK with a one-day artifact retention. It does not use Production signing secrets. No successful live Staging probe, owner-approved origins, or Staging APK artifact are evidenced.
- The separate `staging-readiness.yml` workflow remains manual-only and GET-only; it performs no APK build. Neither this workflow nor the Staging Debug APK path tests live authentication, Storage permissions, booking/payment E2E or physical Android behavior.
- The Supabase Auth Health URL was checked with an unauthenticated GET from the verification environment on 2026-11-23. DNS resolution failed (`curl: (6) Could not resolve host`), and the web retrieval client could not access the URL. This is an environment access failure and does not establish a Supabase Project outage. No credentials were used and no Supabase settings were changed.
- GitHub Governance was rechecked on 2026-11-23. Website rulesets returned an empty list. The dedicated branch-protection endpoint returned HTTP 403 to the connected integration for both repositories; the private Mobile rulesets endpoint returned HTTP 403 with a GitHub Pro/public-visibility restriction. The last successful branch-protection read on 2026-11-21 reported classic protection disabled for both repositories. Current enforcement therefore remains unverified by this integration and requires owner action. No repository settings were changed, no repository was made public, and no paid plan was enabled.
- The Bootstrap manifest at `scripts/bootstrap-manifest.json` was fetched directly and remains SHA `25af11dff0fc467f2d063e4c7f2bd6808fbc9249`: 37 entries comprising one schema file and 36 SQL migrations. No Bootstrap apply or Provider/Production migration was run.

## Limited Pilot — Vang Vieng (Readiness Only; Not Authorized)

This section is an operational gate checklist, not approval to expose the service area, enable Booking API, upload Partner evidence, deploy Production, or accept real customers. Vang Vieng remains the only intended initial commercial pilot area; its live booking gate stays closed until separate owner approval.

| Gate | Required evidence before pilot consideration | Current status (verification snapshot 2026-11-23) |
|---|---|---|
| Supabase Provider Staging | Correct project ref; verified TLS; reviewed exposed schemas, roles/ACLs, RLS, Storage privacy and Network Restrictions using read-only evidence. | BLOCKED — no current Dashboard/database evidence; unauthenticated Auth Health GET failed DNS resolution from the verification environment on 2026-11-23, which does not establish a Project outage. |
| Website / Backend Staging | Owner-approved Staging origin; v2 metadata and closed launch gates verified over HTTPS; no Production origin probed. | BLOCKED — Website Main CI, Database Integration and Vercel status are successful on `340b0160bf4f2e6c4d1e818a8a8c4907764d2f2b`; no owner-approved Staging origin or Provider HTTPS acceptance is available. |
| Mobile Staging | Dedicated read-only Staging preflight and physical Android smoke test; no Production release preflight substituted for Staging. | BLOCKED — PR #58 added the manual Staging Debug APK path and Main CI passed, but Staging-specific validation/build steps were skipped; no owner-approved origins, successful live probe, APK artifact, or physical Android smoke-test evidence. |
| Partner verification and evidence | Real provider adapter, private evidence access, reviewer retrieval, retention and deletion behavior tested; approval remains server-side and auditable. | BLOCKED — no connected upload API/provider adapter. |
| Booking and inventory | Synthetic-account E2E for request, confirmation, check-in, service and completion; cancellation/expiry, idempotency, concurrency and one-time eligible inventory restoration verified against Provider Staging. | BLOCKED — current evidence is Disposable PostgreSQL only. |
| Payment and commission | Payment remains separate from booking status; PAY_AT_PARTNER is direct Partner payment; LAUNCH_FREE is 0%; post-expiry commission requires separately accepted terms and an active versioned rule; refund/dispute ledger behavior verified. | BLOCKED — automated regression coverage only; no live Provider E2E. |
| Governance and audit | Required CI checks enforced before merge; material booking, payment, verification, commission, settlement and area changes auditable. | FAIL / BLOCKED — the last successful branch-protection read on 2026-11-21 reported classic protection off for both repositories. On 2026-11-23, Website rulesets were empty, but branch-protection reads returned HTTP 403 for both repositories and the private Mobile rulesets endpoint returned HTTP 403. Current enforcement cannot be verified by this integration; owner action is required. |
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
