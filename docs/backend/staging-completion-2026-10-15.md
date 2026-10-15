# LaosTravel — Staging completion and approval package (2026-10-15)

This document supersedes the **create a new project** instructions from 2026-10-11. Reuse the existing `laostravel-staging`, ref `fnsszfomslvpxghjukid`, URL `https://fnsszfomslvpxghjukid.supabase.co`. Never open, migrate, change settings or inspect credentials for the separate **LaosTravel Production** project. Contract remains `2026-10-10.v2`.

## Current evidence

| Item | Evidence / scope |
|---|---|
| Web baseline main | `249d93c6b1d9a9a13b45ad67e97cfdb39cb3b023`; post-merge Website CI 38140092882 and Database integration 38140092831 successful |
| Mobile main | `d1f9f5d07def26aa8a11947ff76ce945c349ad82`; CI 38063717783 successful; binary/upload steps skipped |
| Open PRs at start | None in either repository |
| Staging public JWKS | HTTPS GET returned 200 with one EC / ES256 signing public key on 2026-10-15; backend supports ES256. No private keys retrieved. This does not prove token issuer/audience or live authentication. |
| Dashboard inspection | Work browser redirected to Supabase sign-in. No authenticated session available; settings below were not independently verified. No Production project opened. |
| Owner-reported settings | Healthy Free/Nano; SSL enforced; PostgreSQL external access restricted; Data API intended disabled; Private `booking-evidence`, 10 MB, JPEG/PNG/WebP/PDF, no policies; product migrations absent; no confirmed Staging host. Treat these as reported until checked live. |

No Supabase changes or database connection were attempted. Public JWKS access does not need database access, secret keys or a publishable key. The real token `iss` must equal `https://fnsszfomslvpxghjukid.supabase.co/auth/v1`; `aud` must contain `authenticated`. Actual claims remain Not Tested without a signed-in synthetic user.

## Fix and preparation

The old runtime readiness rejected any query string in `DATABASE_URL`, including the verified TLS parameters recommended in the existing environment template. It now accepts `sslmode=verify-full` and `sslrootcert` while rejecting insecure/ambiguous SSL query options. Auth/storage URLs remain query-free and all approval gates remain unchanged.

- `scripts/bootstrap-checksums.json` locks base schema, all 36 migrations and hardening SQL. The 0001–0034 range contains both 0025 files and both 0027 files; do not deduplicate by numeric prefix.
- `scripts/staging-bootstrap.mjs` is a **separate provider runner**, not the disposable CI psql runner. Default `--plan` is offline with no connection; `--check` is read-only; `--apply` is future manual use only after owner approval for the exact plan.
- Target checks pin this Staging ref, PostgreSQL database `postgres`, direct host or session pooler username containing this ref, port 5432, verified-full TLS + a CA path. Other projects/hosts, port 6543 transaction poolers, insecure/duplicate options and missing/stale approval fail closed.
- Approval binds SQL checksums **and runner bytes**. Obtain the current `planHash` with `npm run staging:plan`; bind owner approval to that exact hash. Any runner/SQL change needs new review/approval.
- One transaction applies base schema + migrations + RLS hardening + operational audit record. Standalone BEGIN/COMMIT wrappers are removed in memory; SQL files/history are unchanged. Advisory lock and timeouts prevent concurrent bootstrap.
- Bootstrap refuses any existing non-extension public relation or existing operations schema. It is **not** a general incremental migration runner and must not be used on a populated project.
- Postflight requires all 36 full migration stems and RLS on every product table. The extra `laostravel_staging_ops.bootstrap_runs` table records the approved plan hash; schema/table access is revoked from PUBLIC/anon/authenticated. No business-role grants, passwords or signing changes are made.
- `scripts/staging-provider-audit.sql` is read-only and reports TLS, roles, public RLS/default ACLs, policies and bucket metadata. It does not query secret/auth credential tables or change provider-managed `auth`/`storage` schemas.
- `scripts/staging-smoke.mjs` makes only anonymous GET requests against an explicitly owner-pinned HTTPS Staging origin: full v2 booking/payment enums, launch policy/server authority, closed readiness gates and fail-closed anonymous session. A 503 unconfigured auth is recorded as closed, **not** live Auth success.

## Required live checks before any apply

1. Connect the owner's Supabase session through the secure browser sign-in flow. Never paste passwords/OTP/API secrets in chat. Verify project name/ref matches Staging before each consequential action; do not navigate into Production.
2. Verify Data API disabled (or `public` not exposed), Enforce SSL enabled, exact Network Restrictions and no broad client policies. Dashboard confirmation is required: HTTPS JWKS and `pg_stat_ssl` do not prove server-wide SSL enforcement or Data API state.
3. Select the actual host/operator connection origin. Owner reviews exact egress IP/CIDR allowlist; never use `0.0.0.0/0` or `::/0`. Do not add changing GitHub-hosted runner IP ranges. No GitHub–Supabase integration is required for this manual bootstrap.
4. Stage the CA and connection string in the host's private environment/secret manager, never repository/CLI arguments/chat/logs. `STAGING_DATABASE_URL` is used only by the operator runner; Website runtime uses `DATABASE_URL`. Supply values separately, do not copy operator approval into app runtime.
5. Verify no product tables or data exist, review the offline plan/checksum file and the impact/rollback below, then obtain owner's approval for this **specific database change**. Code PR approval/CI success is not database authorization.

## Database change for owner approval — not executed

| Scope | Proposed impact |
|---|---|
| Target | Only existing `laostravel-staging`, ref `fnsszfomslvpxghjukid`, DB `postgres`, empty product/public schema |
| SQL | Base reference schema + 36 existing migrations + `db/staging/client-isolation.sql`; no old migration edited |
| Product objects | 50 product tables plus their existing indexes, constraints and seed/reference rows; Vang Vieng existing launch seed preserved |
| Security | Enable RLS and revoke PUBLIC/anon/authenticated table grants and defaults for the migration owner; keep trusted Backend owner access and existing application authorization |
| Operational object | Dedicated `laostravel_staging_ops` schema + plan-hash audit table, owner-only access |
| Unchanged | Provider `auth`/`storage` tables, credentials, keys, Network Restrictions, billing, Production, Payment Gateway, client business contract |
| Gates | `BOOKING_API_APPROVED=false`; `PARTNER_EVIDENCE_UPLOAD_APPROVED=false`. No external payment integration enabled. There is no separate supported `PAYMENT_API_APPROVED` variable to invent. |

### Rollback and recovery

- Before apply, preserve an owner-controlled encrypted schema/config backup or verified record of the empty product schema; provider Auth/Storage may already exist and must be preserved. Free project availability does not imply an automatic backup/PITR entitlement.
- **Before commit:** any SQL/postflight error causes `ROLLBACK` of the entire bootstrap including hardening/default ACL changes. Tests deliberately fail after DDL and verify no product tables/migration history remain.
- **Ambiguous connection loss around commit:** do not retry blindly. Owner checks whether product tables and the operations plan hash exist; the runner deliberately refuses a populated schema.
- **After successful commit:** no destructive DROP/CASCADE rollback is supplied. Keep host and gates closed, inspect the exact objects/data and prepare a separately approved recovery/reversal or restore. Never delete/recreate the whole Supabase project: that would risk Auth, Storage and existing configuration.
- Revoke any temporary operator allowlist only after checking the chosen host's requirements. Do not modify network settings automatically.

### Future manual commands (after owner approval)

No credentials occur in these commands. Supply the private environment through approved secret handling first. Do not set approval just to make an error disappear.

```bash
npm run staging:plan
node scripts/staging-bootstrap.mjs --check
# Owner reviews impact/rollback and approves the exact plan hash.
# STAGING_MIGRATION_APPROVAL=<staging-ref>:<approved-planHash> is then supplied securely.
node scripts/staging-bootstrap.mjs --apply
```

This work does **not** run the last command against Supabase. The operator template is `docs/backend/staging.env.example`; the app template remains `.env.example`.

## Hosting options — choose once, then approve exact network scope

| Option | Incremental cost direction | Constraints / suitability |
|---|---|---|
| Existing approved Node host with known egress | May be zero if already paid/provisioned; verify account | Shortest safe route if available. Must run Next.js Node + `pg`, support verified TLS/CA, private env and a known bounded egress allowlist. No such Staging host is confirmed. |
| Render Free Web Service | $0 within current Free limits; no database purchase | Supports a Node web service; idle service sleeps after 15 minutes and has cold starts/resource quotas. Shared regional outbound ranges must be reviewed and explicitly allowlisted. Keep Supabase as DB; do not create Render Postgres. Build/runtime memory and test latency need real validation. |
| Vercel existing commercial plan | Verify current plan and outbound-network cost | Existing repository checks show Vercel integration, but this does not prove an isolated Staging environment or approved DB egress. Hobby is limited to personal non-commercial use; do not assume this business project qualifies. Commercial plan/fixed-egress requirements may cost money and need owner approval. |

Recommendation is conditional: reuse an already-approved host if it meets network/TLS constraints; otherwise evaluate Render Free as a low-cost trial candidate. No hosting service, subscription, deployment, account integration or allowlist is created by this work. Highest isolation and lowest cost can conflict when egress IP ranges are shared; owner decides the exact accepted boundary. Do not route around Network Restrictions via proxies or alternate services.

Official sources checked 2026-10-15:
- https://render.com/docs/free
- https://render.com/docs/outbound-ip-addresses
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines
- https://supabase.com/docs/guides/platform/ssl-enforcement
- https://supabase.com/docs/guides/database/connecting-to-postgres

## E2E acceptance plan

| Stage | Tests | Required evidence / stop condition |
|---|---|---|
| A: gates closed | Owner-pinned HTTPS smoke; v2 contract; both gates closed; unauthenticated session denied; verified TLS DB/role/RLS/default ACL audit; Data API denial | Record commit, origin/project, timestamps and sanitized results. No booking/payment mutations. |
| B: Auth and internal mapping | Web email/password, email confirmation/recovery callback; Mobile phone/SMS OTP; exact issuer/audience/JWKS; wrong issuer/audience, invalid signature/expired/revoked tokens, unmapped/SUSPENDED users; logout/refresh races | Provider account does not grant internal authorization. Trusted provisioning maps `(issuer,sub)` to ACTIVE internal user; roles/membership remain separate. Delivery/callback gaps remain Blocked. No credentials in output. |
| C: synthetic commercial path | Only after separate Staging gate approval: verified partner + ready service + open area → quote → requested booking → replay → authorized lifecycle; check-in ≠ paid; restore resellable capacity once; commission only COMPLETED+PAID+terms, snapshot stable; REFUNDED→DISPUTED denied | Synthetic users/data only; no external payments. Existing free-six-calendar-month rule starts at real commercial activation, unchanged. Do not treat UI display as evidence of DB mutation. |
| D: private evidence | Confirm bucket private/10 MB/allowed MIME; unauthenticated and cross-partner denied; authorized reviewer; signed URL expiry/revocation, retention/deletion | No provider upload adapter exists. Bucket alone is insufficient; keep evidence gate false. Implementing/reviewing that connection is a remaining technical workstream; no fake broad policy or real identity evidence. |
| E: devices | Browser and Mobile using same Staging Backend/project; session/account isolation; contract mismatch blocks mutations | No APK/AAB/build artifact in this round. Source/CI cannot prove physical-device acceptance. |

## Shortest safe continuation for the owner

A single coordinated session is sufficient for the next review: connect Supabase securely, choose an existing suitable host or approve a Free hosting candidate, verify Staging settings and bounded egress, review the generated plan/rollback, then explicitly approve the specific bootstrap. Work can then execute only that approved change, verify native connection and closed-gate smoke. Live Auth/delivery, evidence adapter and device checks remain separate gates; do not announce full Staging readiness until those actual paths pass.
