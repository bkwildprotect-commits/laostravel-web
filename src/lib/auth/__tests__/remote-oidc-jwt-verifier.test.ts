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
});
