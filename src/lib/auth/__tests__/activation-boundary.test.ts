import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("protected UI activation boundary",()=>{
 it("connects auth through the verified session adapter without token persistence exists",()=>{
  const source=readFileSync(resolve(process.cwd(),"src/components/AuthForm.tsx"),"utf8");
  expect(source).toContain("connectedBackend.authenticate");
  expect(source).toContain("CONFIGURATION_REQUIRED");
  expect(source).not.toContain("localStorage.setItem");
 });
 it("documents production OIDC and GPS activation prerequisites",()=>{
  const doc=readFileSync(resolve(process.cwd(),"docs/backend/authentication-activation.md"),"utf8");
  expect(doc).toContain("Authorization Code + PKCE");
  expect(doc).toContain("auth_identities");
  expect(doc).toContain("admin_role_assignments");
  expect(doc).toContain("cannot self-verify");
 });
});
