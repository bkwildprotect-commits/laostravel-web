import type {PgPoolLike} from "@/lib/infrastructure/postgres-transaction";import type {AuthenticationAdapter} from "./authentication";import {UnconfiguredAuthenticationAdapter} from "./authentication";import {OidcAuthenticationAdapter} from "./oidc-authentication";import {PostgresAuthIdentityStore} from "./postgres-auth-identity-store";import {RemoteOidcJwtVerifier} from "./remote-oidc-jwt-verifier";
export function createAuthenticationAdapter(input:{pool?:PgPoolLike;env?:Record<string,string|undefined>}={}):AuthenticationAdapter{
 const env=input.env??process.env;const issuer=env.AUTH_ISSUER_URL?.trim(),audience=env.AUTH_AUDIENCE?.trim();
 if(!input.pool||!issuer||!audience)return new UnconfiguredAuthenticationAdapter();
 return new OidcAuthenticationAdapter(new RemoteOidcJwtVerifier(),new PostgresAuthIdentityStore(input.pool,issuer),env);
}
