import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("admin GPS review API",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/app/api/v1/admin/locations/[locationId]/review/route.ts"),"utf8");
 it("requires internal admin or location reviewer role",()=>{expect(source).toContain('allowedRoles:["ADMIN","LOCATION_REVIEWER"]');expect(source).toContain("AdminAuthorizationError");expect(source).toContain("status:403")});
 it("accepts only explicit verified or rejected decisions with optimistic token",()=>{expect(source).toContain('decision!=="VERIFIED"&&decision!=="REJECTED"');expect(source).toContain("expectedUpdatedAt");expect(source).toContain("LOCATION_REVIEW_CONFLICT")});
});
