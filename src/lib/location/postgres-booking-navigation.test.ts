import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("booking navigation API privacy contract",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/lib/location/postgres-booking-navigation.ts"),"utf8");
 it("binds navigation lookup to authenticated booking owner",()=>{expect(source).toContain("b.user_id=$2");expect(source).toContain("input.userId")});
 it("requires the service meeting point and verified visibility policy",()=>{expect(source).toContain("SERVICE_MEETING_POINT");expect(source).toContain("canExposeLocation")});
 it("does not gate navigation on payment status",()=>{expect(source).not.toContain("payment_status");expect(source).not.toContain("PAID")});
});
