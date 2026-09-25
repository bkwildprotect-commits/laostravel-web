import {describe,expect,it,vi} from "vitest";import {AuthenticationError} from "../authentication";import {OidcAuthenticationAdapter} from "../oidc-authentication";
const env={AUTH_ISSUER_URL:"https://issuer.example",AUTH_AUDIENCE:"laostravel"};
const verifier={verify:vi.fn(async()=>({sub:"subject-1",iss:env.AUTH_ISSUER_URL,aud:env.AUTH_AUDIENCE,exp:Math.floor(Date.now()/1000)+60}))};
const identities={findActiveUserIdBySubject:vi.fn(async()=>"user-1")};
describe("OidcAuthenticationAdapter",()=>{
 it("requires bearer auth",async()=>{const a=new OidcAuthenticationAdapter(verifier,identities,env);await expect(a.authenticate(new Request("https://x"))).rejects.toMatchObject({code:"AUTH_REQUIRED"} satisfies Partial<AuthenticationError>)});
 it("maps verified subject to internal user",async()=>{const a=new OidcAuthenticationAdapter(verifier,identities,env);await expect(a.authenticate(new Request("https://x",{headers:{authorization:"Bearer token"}}))).resolves.toEqual({userId:"user-1",subject:"subject-1"})});
 it("rejects expired claims",async()=>{const v={verify:vi.fn(async()=>({sub:"s",iss:env.AUTH_ISSUER_URL,aud:env.AUTH_AUDIENCE,exp:1}))};const a=new OidcAuthenticationAdapter(v,identities,env);await expect(a.authenticate(new Request("https://x",{headers:{authorization:"Bearer token"}}))).rejects.toMatchObject({code:"AUTH_INVALID"})});
});
