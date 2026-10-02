# Supabase Auth production configuration

LaosTravel uses Supabase Auth as its selected identity provider while retaining LaosTravel-owned authorization rules.

## Server configuration
Set these only in the deployment environment; never commit project credentials.

- `AUTH_ISSUER_URL=https://<project-ref>.supabase.co/auth/v1`
- `AUTH_AUDIENCE=authenticated`
- `AUTH_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`

Use Supabase asymmetric JWT signing keys (RS256 or ES256) so LaosTravel can verify access tokens with public JWKS and does not need the project's JWT signing secret.

## Browser/SSR configuration
When the Supabase project exists, use the current `@supabase/ssr` package and Authorization Code + PKCE. The browser may receive only the project URL and Supabase publishable key intended for client use. Never expose a Supabase secret key/service-role key or JWT signing secret.

Session transport must be cookie/SSR based. Do not add long-lived access-token persistence to localStorage.

## LaosTravel identity and authorization
A verified Supabase JWT is authentication, not business authorization. Its `sub` must map through `auth_identities` to an ACTIVE LaosTravel user.

Partner access remains controlled by `partner_members`. GPS review remains controlled by ACTIVE `ADMIN` or `LOCATION_REVIEWER` records in `admin_role_assignments`. Supabase's JWT `role=authenticated` must never be treated as a LaosTravel admin role.

## Activation values still required from project owner
After creating the Supabase project, supply deployment configuration through the hosting platform:
- project URL / project reference
- publishable key for SSR/browser client configuration
- production Site URL and allowed redirect URLs

No secret value should be pasted into source code, GitHub commits, or chat.
