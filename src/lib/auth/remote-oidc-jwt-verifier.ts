import {createRemoteJWKSet,jwtVerify} from "jose";import {AuthenticationError} from "./authentication";import type {OidcTokenVerifier,VerifiedOidcClaims} from "./oidc-authentication";
type Discovery={issuer?:string;jwks_uri?:string};
export class RemoteOidcJwtVerifier implements OidcTokenVerifier{
 private jwks=new Map<string,ReturnType<typeof createRemoteJWKSet>>();private discovery=new Map<string,Discovery>();
 constructor(private env:Record<string,string|undefined>=process.env){}
 async verify(token:string,input:{issuer:string;audience:string}):Promise<VerifiedOidcClaims>{
  try{
   const issuer=input.issuer.replace(/\/$/,"");const issuerUrl=new URL(issuer);if(issuerUrl.protocol!=="https:")throw new AuthenticationError("AUTH_INVALID");
   const explicit=this.env.AUTH_JWKS_URL?.trim();let jwksUri:string,verifiedIssuer=issuer;
   if(explicit){
    const url=new URL(explicit);if(url.protocol!=="https:"||url.origin!==issuerUrl.origin)throw new AuthenticationError("AUTH_INVALID");
    jwksUri=url.toString();
   }else{
    let discovery=this.discovery.get(issuer);
    if(!discovery){const response=await fetch(issuer+"/.well-known/openid-configuration",{headers:{accept:"application/json"}});if(!response.ok)throw new AuthenticationError("AUTH_INVALID");discovery=await response.json() as Discovery;if(discovery.issuer?.replace(/\/$/,"")!==issuer||!discovery.jwks_uri)throw new AuthenticationError("AUTH_INVALID");const jwksUrl=new URL(discovery.jwks_uri);if(jwksUrl.protocol!=="https:")throw new AuthenticationError("AUTH_INVALID");this.discovery.set(issuer,discovery)}
    jwksUri=discovery.jwks_uri!;verifiedIssuer=discovery.issuer!;
   }
   let key=this.jwks.get(jwksUri);if(!key){key=createRemoteJWKSet(new URL(jwksUri),{});this.jwks.set(jwksUri,key)}
   const {payload}=await jwtVerify(token,key,{issuer:verifiedIssuer,audience:input.audience,algorithms:["RS256","PS256","ES256"]});
   if(typeof payload.sub!=="string"||typeof payload.iss!=="string"||typeof payload.exp!=="number"||!(typeof payload.aud==="string"||Array.isArray(payload.aud)))throw new AuthenticationError("AUTH_INVALID");
   return {sub:payload.sub,iss:payload.iss,aud:payload.aud as string|string[],exp:payload.exp};
  }catch(error){if(error instanceof AuthenticationError)throw error;throw new AuthenticationError("AUTH_INVALID")}
 }
}
