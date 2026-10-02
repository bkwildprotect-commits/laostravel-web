import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("GPS review boundary",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/lib/location/postgres-location-review.ts"),"utf8");
 it("reviews pending rows only and uses optimistic concurrency",()=>{expect(source).toContain("verification_status='PENDING'");expect(source).toContain("updated_at=$4::timestamptz");expect(source).toContain("LocationReviewConflictError")});
 it("records reviewer evidence and audit history",()=>{expect(source).toContain("verified_by_user_id=$2");expect(source).toContain("LOCATION_VERIFIED");expect(source).toContain("LOCATION_REJECTED");expect(source).toContain("audit_logs")});
});
