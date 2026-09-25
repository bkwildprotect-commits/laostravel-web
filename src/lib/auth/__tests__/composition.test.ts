import {describe,expect,it} from "vitest";import {AuthenticationError} from "../authentication";import {createAuthenticationAdapter} from "../composition";
describe("authentication composition",()=>{
 it("fails closed without a PostgreSQL pool",async()=>{const auth=createAuthenticationAdapter({env:{AUTH_ISSUER_URL:"https://issuer.example",AUTH_AUDIENCE:"laostravel"}});await expect(auth.authenticate(new Request("https://x"))).rejects.toMatchObject({code:"AUTH_NOT_CONFIGURED"} satisfies Partial<AuthenticationError>)});
 it("fails closed when OIDC config is incomplete",async()=>{const pool={connect:async()=>{throw new Error("must not connect")}};const auth=createAuthenticationAdapter({pool,env:{AUTH_ISSUER_URL:"https://issuer.example"}});await expect(auth.authenticate(new Request("https://x"))).rejects.toMatchObject({code:"AUTH_NOT_CONFIGURED"})});
});
