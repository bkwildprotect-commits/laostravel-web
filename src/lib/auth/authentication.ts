export type AuthenticatedUser={userId:string;subject:string};
export class AuthenticationError extends Error{constructor(public code:"AUTH_REQUIRED"|"AUTH_INVALID"|"AUTH_NOT_CONFIGURED"){super(code)}}
export interface AuthenticationAdapter{authenticate(request:Request):Promise<AuthenticatedUser>}
/**
 * Fail-closed placeholder. A concrete OIDC/JWT verifier must validate signature, issuer,
 * audience and expiry before returning the internal LaosTravel user id.
 * Never resolve userId from request JSON or unverified token claims.
 */
export class UnconfiguredAuthenticationAdapter implements AuthenticationAdapter{
 async authenticate(_request:Request):Promise<AuthenticatedUser>{throw new AuthenticationError("AUTH_NOT_CONFIGURED")}
}
