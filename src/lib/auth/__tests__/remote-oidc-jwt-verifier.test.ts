import {afterEach,describe,expect,it,vi} from "vitest";
import {RemoteOidcJwtVerifier} from "../remote-oidc-jwt-verifier";

afterEach(()=>{vi.unstubAllGlobals()});

describe("RemoteOidcJwtVerifier transport security",()=>{
 it("rejects a non-HTTPS issuer before discovery fetch",async()=>{
  const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
  const verifier=new RemoteOidcJwtVerifier();
  await expect(verifier.verify("token",{issuer:"http://identity.example",audience:"laostravel"})).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("rejects a non-HTTPS JWKS endpoint from discovery",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({issuer:"https://identity.example",jwks_uri:"http://identity.example/jwks"})}));
  const verifier=new RemoteOidcJwtVerifier();
  await expect(verifier.verify("token",{issuer:"https://identity.example",audience:"laostravel"})).rejects.toThrow();
 });
 it("rejects an explicit JWKS URL on a different origin before key retrieval",async()=>{
  const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
  const verifier=new RemoteOidcJwtVerifier({AUTH_JWKS_URL:"https://attacker.example/jwks.json"});
  await expect(verifier.verify("token",{issuer:"https://project.supabase.co/auth/v1",audience:"authenticated"})).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("accepts same-origin explicit JWKS configuration boundary",async()=>{
  const verifier=new RemoteOidcJwtVerifier({AUTH_JWKS_URL:"https://project.supabase.co/auth/v1/.well-known/jwks.json"});
  await expect(verifier.verify("not-a-jwt",{issuer:"https://project.supabase.co/auth/v1",audience:"authenticated"})).rejects.toThrow();
 });
});
