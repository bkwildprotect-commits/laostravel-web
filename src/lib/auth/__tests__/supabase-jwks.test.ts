import {afterEach, describe, expect, it, vi} from "vitest";
import {exportJWK, generateKeyPair, SignJWT} from "jose";
import {RemoteOidcJwtVerifier} from "../remote-oidc-jwt-verifier";
import {OidcAuthenticationAdapter} from "../oidc-authentication";

const issuer="https://staging-project.supabase.co/auth/v1";
const jwks=issuer+"/.well-known/jwks.json";
const audience="authenticated";
const env={AUTH_ISSUER_URL:issuer,AUTH_AUDIENCE:audience,AUTH_JWKS_URL:jwks};
afterEach(()=>vi.unstubAllGlobals());

async function fixture(algorithm="ES256"){
 const keys=await generateKeyPair(algorithm);
 const publicKey={...await exportJWK(keys.publicKey),kid:"synthetic-staging",alg:algorithm,use:"sig"};
 const fetchMock=vi.fn(async(url:unknown)=>{
  expect(String(url)).toBe(jwks);
  return Response.json({keys:[publicKey]});
 });
 vi.stubGlobal("fetch",fetchMock);
 const sign=(claims:Record<string,unknown>={},kid="synthetic-staging")=>new SignJWT({sub:"provider-subject",iss:issuer,aud:audience,exp:Math.floor(Date.now()/1000)+60,...claims})
  .setProtectedHeader({alg:algorithm,kid}).sign(keys.privateKey);
 return {sign,fetchMock,verifier:new RemoteOidcJwtVerifier(env)};
}

describe("Supabase asymmetric JWT compatibility using synthetic keys only",()=>{
 it.each(["ES256","RS256"])("verifies %s then requires mapped ACTIVE internal identity",async algorithm=>{
  const f=await fixture(algorithm),token=await f.sign();
  const identities={findActiveUserIdBySubject:vi.fn(async()=>"internal-user")};
  const auth=new OidcAuthenticationAdapter(f.verifier,identities,env);
  await expect(auth.authenticate(new Request("https://staging.invalid",{headers:{authorization:`Bearer ${token}`}})))
   .resolves.toEqual({userId:"internal-user",subject:"provider-subject"});
  expect(identities.findActiveUserIdBySubject).toHaveBeenCalledWith("provider-subject");
  expect(f.fetchMock).toHaveBeenCalledOnce();
 });
 it.each([
  {iss:"https://other-project.supabase.co/auth/v1"}, {aud:"anon"},
  {exp:1}, {exp:undefined}, {sub:undefined}, {nbf:Math.floor(Date.now()/1000)+3600},
 ])("invalid claims fail before identity lookup: %j",async claims=>{
  const f=await fixture(),identities={findActiveUserIdBySubject:vi.fn()};
  const auth=new OidcAuthenticationAdapter(f.verifier,identities,env);
  const token=await f.sign(claims);
  await expect(auth.authenticate(new Request("https://staging.invalid",{headers:{authorization:`Bearer ${token}`}}))).rejects.toMatchObject({code:"AUTH_INVALID"});
  expect(identities.findActiveUserIdBySubject).not.toHaveBeenCalled();
 });
 it("rejects an unknown signing key",async()=>{
  const f=await fixture();
  await expect(f.verifier.verify(await f.sign({},"unknown"),{issuer,audience})).rejects.toMatchObject({code:"AUTH_INVALID"});
 });
 it("rejects a forged signature even with the expected kid",async()=>{
  const f=await fixture(),attacker=await generateKeyPair("ES256");
  const token=await new SignJWT({sub:"s",iss:issuer,aud:audience,exp:Math.floor(Date.now()/1000)+60})
   .setProtectedHeader({alg:"ES256",kid:"synthetic-staging"}).sign(attacker.privateKey);
  await expect(f.verifier.verify(token,{issuer,audience})).rejects.toMatchObject({code:"AUTH_INVALID"});
 });
 it("unmapped provider account is denied without auto-provisioning",async()=>{
  const f=await fixture(),auth=new OidcAuthenticationAdapter(f.verifier,{findActiveUserIdBySubject:async()=>null},env);
  await expect(auth.authenticate(new Request("https://staging.invalid",{headers:{authorization:`Bearer ${await f.sign()}`}}))).rejects.toMatchObject({code:"AUTH_INVALID"});
 });
 it("JWKS outage fails closed",async()=>{
  const f=await fixture();vi.stubGlobal("fetch",vi.fn(async()=>new Response(null,{status:503})));
  await expect(f.verifier.verify(await f.sign(),{issuer,audience})).rejects.toMatchObject({code:"AUTH_INVALID"});
 });
});
