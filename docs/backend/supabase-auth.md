# Supabase Auth production configuration

LaosTravel uses Supabase Auth as its selected identity provider while retaining LaosTravel-owned authorization rules.

## Server configuration
Set these only in the deployment environment; never commit project credentials.

- `AUTH_ISSUER_URL=https://<project-ref>.supabase.co/auth/v1`
- `AUTH_AUDIENCE=authenticated`
- `AUTH_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`

Use Supabase asymmetric JWT signing keys (RS256 or ES256) so LaosTravel can verify access tokens with public JWKS and does not need the project's JWT signing secret.

## Browser/SSR configuration
The current connected Website uses Supabase email/password REST authentication with memory-only access and refresh tokens. It sends Bearer tokens to same-origin LaosTravel APIs. Mobile uses phone/SMS OTP with memory-only tokens. No `@supabase/ssr` or PKCE callback adapter is installed in the current source; those are not enabled by environment values.

Browser configuration is `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only a publishable/legacy anon key may be exposed; never expose secret/service-role keys, database credentials or JWT signing secrets. Do not persist long-lived tokens in localStorage.

Registration email delivery, recovery completion/callbacks, Mobile SMS delivery and trusted internal provisioning require live acceptance. Follow [the Staging owner guide](staging-owner-guide-th.md); keep booking/evidence gates closed until their acceptance requirements pass.

## LaosTravel identity and authorization
A verified Supabase JWT is authentication, not business authorization. Its `sub` must map through `auth_identities` to an ACTIVE LaosTravel user.

Partner access remains controlled by `partner_members`. GPS review remains controlled by ACTIVE `ADMIN` or `LOCATION_REVIEWER` records in `admin_role_assignments`. Supabase's JWT `role=authenticated` must never be treated as a LaosTravel admin role.

## Activation values still required from project owner
After creating the Supabase project, supply deployment configuration through the hosting platform:
- project URL / project reference
- publishable key for SSR/browser client configuration
- production Site URL and allowed redirect URLs

No secret value should be pasted into source code, GitHub commits, or chat.
