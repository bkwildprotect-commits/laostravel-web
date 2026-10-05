import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("admin Partner commercial activation API",()=>{
 const source=readFileSync(
  resolve(process.cwd(),"src/app/api/v1/admin/partners/[partnerId]/activate/route.ts"),
  "utf8"
 );

 it("allows only ADMIN identities",()=>{
  expect(source).toContain('allowedRoles:["ADMIN"]');
  expect(source).toContain("AdminAuthorizationError");
  expect(source).toContain("status:403");
 });

 it("runs activation inside a serializable transaction",()=>{
  expect(source).toContain('.run("SERIALIZABLE"');
  expect(source).toContain("activatePartnerCommercially");
  expect(source).toContain("actorUserId:actor.userId");
 });

 it("fails closed without leaking internal activation details",()=>{
  expect(source).toContain('e.code==="PARTNER_NOT_FOUND"?404:409');
  expect(source).toContain('code:"INTERNAL_ERROR"');
  expect(source).toContain("status:500");
 });
});
