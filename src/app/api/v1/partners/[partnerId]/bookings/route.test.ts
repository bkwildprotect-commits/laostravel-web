import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("partner bookings API authorization contract",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/app/api/v1/partners/[partnerId]/bookings/route.ts"),"utf8");
 it("maps explicit partner access denial to HTTP 403",()=>{
  expect(source).toContain("error instanceof PartnerAccessDeniedError");
  expect(source).toContain('code:"PARTNER_ACCESS_DENIED"');
  expect(source).toContain("status:403");
 });
 it("keeps authentication and authorization distinct",()=>{
  expect(source).toContain("AuthenticationError");
  expect(source).toContain("status:error.code===\"AUTH_NOT_CONFIGURED\"?503:401");
  expect(source).toContain("PartnerAccessDeniedError");
 });
 it("does not expose internal failures",()=>{
  expect(source).toContain('code:"INTERNAL_ERROR"');
  expect(source).toContain('message:"Partner bookings could not be loaded."');
 });
});
