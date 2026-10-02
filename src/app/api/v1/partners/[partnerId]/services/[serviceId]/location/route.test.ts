import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("service meeting point API security contract",()=>{
 const persistence=readFileSync(resolve(process.cwd(),"src/lib/location/postgres-partner-location.ts"),"utf8");
 const route=readFileSync(resolve(process.cwd(),"src/app/api/v1/partners/[partnerId]/services/[serviceId]/location/route.ts"),"utf8");
 it("requires both membership and service ownership",()=>{expect(persistence).toContain("partner_members");expect(persistence).toContain("services WHERE id=$1 AND partner_id=$2")});
 it("resets edited pins to pending review",()=>{expect(persistence).toContain("verification_status='PENDING'");expect(persistence).toContain("verified_by_user_id=NULL");expect(persistence).toContain("verified_at=NULL")});
 it("does not let partner self-verify a meeting point",()=>{expect(route).not.toContain("v.verificationStatus");expect(route).not.toContain("v.verifiedAt")});
});
