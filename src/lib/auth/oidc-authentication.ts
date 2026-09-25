import type {AuthenticatedUser,AuthenticationAdapter} from "./authentication";
export type VerifiedOidcClaims={sub:string;iss:string;aud:string|string[];exp:number};
export interface OidcTokenVerifier{verify(token:string,input:{issuer:string;audience:string}):Promise<VerifiedOidcClaims>}
export interface AuthIdentityStore{findActiveUserIdBySubject(subject:string):Promise<string|null>}
export class OidcAuthenticationAdapter implements AuthenticationAdapter{
 constructor(private verifier:OidcTokenVerifier,private identities:AuthIdentityStore,private env:Record<string,string|undefined>=process.env){}
 async authenticate(request:Request):Promise<AuthenticatedUser>{
  const issuer=this.env.AUTH_ISSUER_URL?.trim(),audience=this.env.AUTH_AUDIENCE?.trim();if(!issuer||!audience)throw new Error("AUTH_NOT_CONFIGURED");
  const header=request.headers.get("authorization")??"";const match=/^Bearer\s+(.+)$/i.exec(header);if(!match)throw new Error("AUTH_REQUIRED");
  const claims=await this.verifier.verify(match[1],{issuer,audience});
  if(!claims.sub||claims.iss!==issuer||claims.exp*1000<=Date.now())throw new Error("AUTH_INVALID");
  const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];if(!audiences.includes(audience))throw new Error("AUTH_INVALID");
  const userId=await this.identities.findActiveUserIdBySubject(claims.sub);if(!userId)throw new Error("AUTH_INVALID");
  return {userId,subject:claims.sub};
 }
}
