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
