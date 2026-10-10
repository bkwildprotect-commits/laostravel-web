# Authentication activation contract

LaosTravel's protected booking, partner GPS, and administrative GPS-review APIs are intentionally fail-closed until a production OIDC provider is connected.

## Existing server contract
The server accepts a Bearer token and verifies it through OIDC discovery/JWKS using `AUTH_ISSUER_URL` and `AUTH_AUDIENCE`. The verified external subject is mapped through `auth_identities` to an active internal LaosTravel user. Administrative authority is then resolved independently from `admin_role_assignments`; client-provided roles are never authoritative.

## Required production activation
1. Select and configure one production OIDC provider capable of Authorization Code + PKCE for the web application.
2. Configure exact production issuer and audience values in server secrets. Never expose signing secrets in `NEXT_PUBLIC_*`.
3. Implement browser sign-in/callback/logout and secure token/session handling. Protected client requests must reach the existing Bearer-token server contract without storing long-lived access tokens in localStorage.
4. Provision each external OIDC subject into `auth_identities` only after the corresponding LaosTravel user is created/approved.
5. Grant `ADMIN` or `LOCATION_REVIEWER` only through a trusted operational process. No migration or signup path may auto-grant these roles.
6. Exercise protected API integration tests with: unauthenticated, invalid token, valid traveller, valid partner member, wrong partner, location reviewer, revoked reviewer, and admin identities.
7. Only after those tests pass, expose interactive Partner GPS, service meeting-point, traveller navigation, and Admin GPS review controls in the web UI.

## GPS activation acceptance criteria
- Partner venue submission returns PENDING and cannot self-verify.
- Service meeting-point submission proves both partner membership and service ownership.
- Edited verified coordinates clear reviewer evidence and return to PENDING.
- Review requires ACTIVE ADMIN or LOCATION_REVIEWER and rejects stale `expectedUpdatedAt`.
- Traveller navigation proves booking ownership and returns only verified customer-visible coordinates.
- Navigation does not infer or mutate payment status.
- Closed commercial service areas remain closed even when geographic records exist.
- Audit history records sensitive review decisions.

## Deliberate non-goals
Do not add a temporary email/password database, client-side admin flag, shared admin password, query-string role, or public environment-variable bypass. Those would weaken the security boundary already established by the backend.

## Connected Website (2026-10-10.v2)
The existing email/password forms now call Supabase Auth using only explicitly configured public client values: `NEXT_PUBLIC_SUPABASE_URL` (HTTPS origin) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable or legacy anon; secret/service-role rejected). No value is committed or configured by this change. Passwords are sent only to that provider, never to LaosTravel APIs. Tokens remain in memory; reload requires sign-in. Sign-out invalidates pending local responses; refresh is serialized.

Provider sign-in alone grants no account or Partner authority. The signed Bearer token must pass existing backend signature/issuer/audience/expiry checks and ACTIVE `auth_identities`/`users` mapping through `/api/v1/auth/session`. No auto-provisioning, role grants or Partner approval is added. The existing social flow still requires Authorization Code + PKCE and owner/provider callback configuration; it is not enabled by this password connection.

Provider prerequisites: selected project must match backend AUTH_ISSUER_URL/AUTH_AUDIENCE/JWKS, enable the approved email/password method, and configure email confirmation/recovery delivery and approved Site URL/callback. The recovery form requests provider email only; password-reset completion/callback handling remains a blocker. Register confirmation does not grant internal LaosTravel access. Do not claim full signup/recovery/device acceptance without these real checks.

Partner intake uses the authenticated internal owner. New connected Website submissions carry a frozen idempotency key; migration 0034 stores user/key/hash and the original intake reference atomically with an audit entry. Identical retries replay; altered payloads conflict. Legacy callers without keys remain supported but do not have this replay guarantee. Intake receipt status SUBMITTED is the original receipt, not a current verification decision. Evidence upload/private storage, reviewer approval and commercial activation remain separate gates.

Booking connects only the existing intercity catalog, selected availability/verified boarding stop, authoritative quote and booking transaction. Unsupported catalogs remain unavailable. Contract v2 is checked before mutations; financial values are displayed from the quote, never submitted as payment/commission truth. Retry freezes the quote/body/key and internal owner; no implicit retry creates a fresh quote. Benefits redemption remains unavailable.

Migration 0034 enables RLS with no public policies on intake retry records. The trusted backend database role must have the required existing owner/BYPASSRLS access; never grant public/anon access to these records. Validate migration and role permissions in the authorized deployment environment before deployment.
