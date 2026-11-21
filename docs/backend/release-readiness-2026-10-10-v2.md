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
| Signing / binary release | Not Tested | Mobile Main build `42483052841` passed source/tests only; release preflight, APK build, signing and upload were skipped, with zero artifacts. Manual APK release uses Production-backend preflight and signing secrets; the APK upload step is hard-disabled. The separate Staging workflow performs GET-only readiness checks and does not build an APK. Do not read or change signing secrets or keys. |
| Live browser/device/provider E2E | Not Tested | Requires an approved staging provider/database/storage and synthetic test accounts. Unit mocks and disposable PostgreSQL are not proof of live acceptance. |
| Production migrations / deployment | Not Tested / prohibited in this round | No production database, real customer data, migration or release used. |

CI acceptance gate: latest PR head must pass every applicable workflow/check before merge, followed by successful main CI. Website CI runs tests/lint/typecheck/build; Database integration runs disposable PostgreSQL bootstrap/mutations/SQL/E2E/concurrency. No artifact upload is added.

Owner decisions remain separate: internal identity provisioning process; evidence access/retention; finer cancellation/resale cutoffs; commercial terms after the free period; settlement/reconciliation of reversed settled commission. No payment gateway, rate or legal policy changed.


## Verification snapshot — 2026-11-21

- Website Main is `aa55ac6325f14409c679e7581eec74ea7824bb32`, the merge commit for PR #79 on 2026-11-21. Post-merge Website CI run `44847715561` and Database Integration run `44847715515` both completed successfully; the Vercel commit status for this Main commit is `success`. Comparing previous Main `e45acdbb443ce4c073b2e068bd161767ae4b13eb` to current Main shows only `docs/backend/release-readiness-2026-10-10-v2.md` changed (12 additions, 12 deletions across the PR comparison); no runtime code, schema, migration, payment, or business-rule change was made. No open Website PRs were present at the verification time.
- The Database Integration run bootstrapped and mutated disposable PostgreSQL only. It is not evidence of Supabase Provider Staging acceptance.
- Mobile Main remains `ce805eb2cde5b153fe89b049f59aa1d3a9599ade` (no new Mobile Main commit since the prior snapshot). The latest Mobile Actions run remains Build Android APK `42483052841` (run #304), created 2026-11-08. The latest 100 Actions records queried on 2026-11-21 contain no newer Mobile run and no Staging readiness run. Flutter Analyze, Flutter Test, and offline backend preflight tests passed. Release-backend preflight, Release APK build, signing, APK upload, Google Play AAB checks/build/upload were skipped. The run has zero downloadable artifacts.
- The separate Mobile Staging workflow is present in Main and is manual-only. Its `run_read_only_staging_probe` input defaults to `false`; a live probe requires owner-configured, non-secret repository variables `LAOSTRAVEL_STAGING_ENVIRONMENT=staging`, `LAOSTRAVEL_STAGING_BACKEND_URL`, `LAOSTRAVEL_STAGING_APPROVED_ORIGIN`, and `LAOSTRAVEL_BACKEND_URL` (release origin). It requires the Staging origin to match the approved origin and differ from the release origin. It performs unauthenticated HTTPS GET checks only for Shared Contract v2 metadata, production-readiness/closed launch gates, and anonymous-session rejection. It rejects redirects. It does not test live authentication, Storage permissions, booking, payment, or physical Android behavior. No successful live Staging probe or owner-approved origins are evidenced.
- The Mobile Release APK path is separate: it requires a manual `build_release_apk=true` dispatch, uses the Production-backend preflight and signing secrets, and its APK upload step is hard-disabled. It is not a Staging APK path. The Google Play AAB path remains hard-disabled. No signing secrets or keys were read or changed.
- The Supabase Project Auth Health URL was checked with an unauthenticated GET from the verification environment on 2026-11-21. DNS resolution again failed (`curl: (6) Could not resolve host`); the web retrieval client also could not access the URL. This is an environment access failure and does not establish a Supabase Project outage. No credentials were used and no Supabase settings were changed.
- GitHub Main branch metadata rechecked on 2026-11-21 reports classic branch protection disabled for both repositories: `protected=false`, `protection.enabled=false`, and required-status-check enforcement `off` with empty contexts/checks. Website rulesets returned an empty list, so no Website ruleset enforcement was identified. The private Mobile rulesets endpoint returned HTTP 403 with the message that GitHub Pro or public repository visibility is required; Mobile ruleset status therefore remains unverified. The dedicated branch-protection endpoint returned HTTP 403 to the connected integration for both repositories. Owner action is required to establish repository-level CI enforcement. No settings were changed, no repository was made public, and no paid plan was enabled.
- The Bootstrap manifest is unchanged at SHA `25af11dff0fc467f2d063e4c7f2bd6808fbc9249`: 37 entries comprising 36 SQL migrations. No Bootstrap apply or Provider/Production migration was run.

## Limited Pilot — Vang Vieng (Readiness Only; Not Authorized)

This section is an operational gate checklist, not approval to expose the service area, enable Booking API, upload Partner evidence, deploy Production, or accept real customers. Vang Vieng remains the only intended initial commercial pilot area; its live booking gate stays closed until separate owner approval.

| Gate | Required evidence before pilot consideration | Current status (verification snapshot 2026-11-21) |
|---|---|---|
| Supabase Provider Staging | Correct project ref; verified TLS; reviewed exposed schemas, roles/ACLs, RLS, Storage privacy and Network Restrictions using read-only evidence. | BLOCKED — no current Dashboard/database evidence; unauthenticated Auth Health GET failed DNS resolution from the verification environment on 2026-11-21, which does not establish a Project outage. |
| Website / Backend Staging | Owner-approved Staging origin; v2 metadata and closed launch gates verified over HTTPS; no Production origin probed. | BLOCKED — PR #79 Main commit `aa55ac6325f14409c679e7581eec74ea7824bb32` has successful post-merge Website CI, Database Integration and Vercel status on 2026-11-21; no owner-approved Staging origin or Provider HTTPS acceptance is available. |
| Mobile Staging | Dedicated read-only Staging preflight and physical Android smoke test; no Production release preflight substituted for Staging. | BLOCKED — read-only preflight workflow is present in Mobile Main; no owner-approved Staging/Release origins, successful live probe, or physical Android smoke-test evidence. |
| Partner verification and evidence | Real provider adapter, private evidence access, reviewer retrieval, retention and deletion behavior tested; approval remains server-side and auditable. | BLOCKED — no connected upload API/provider adapter. |
| Booking and inventory | Synthetic-account E2E for request, confirmation, check-in, service and completion; cancellation/expiry, idempotency, concurrency and one-time eligible inventory restoration verified against Provider Staging. | BLOCKED — current evidence is Disposable PostgreSQL only. |
| Payment and commission | Payment remains separate from booking status; PAY_AT_PARTNER is direct Partner payment; LAUNCH_FREE is 0%; post-expiry commission requires separately accepted terms and an active versioned rule; refund/dispute ledger behavior verified. | BLOCKED — automated regression coverage only; no live Provider E2E. |
| Governance and audit | Required CI checks enforced before merge; material booking, payment, verification, commission, settlement and area changes auditable. | FAIL / BLOCKED — Website classic branch protection is off and its rulesets list is empty. Mobile classic branch protection is off, but its private rulesets endpoint returns HTTP 403 under the current plan, so ruleset enforcement is unverified. Owner action is required to establish and verify CI enforcement; no repository settings were changed. |
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
