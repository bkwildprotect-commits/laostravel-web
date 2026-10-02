import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("booking navigation API privacy contract",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/lib/location/postgres-booking-navigation.ts"),"utf8");
 it("binds navigation lookup to authenticated booking owner",()=>{expect(source).toContain("b.user_id=$2");expect(source).toContain("input.userId")});
 it("reads immutable booking snapshots instead of mutable service pins",()=>{expect(source).toContain("booking_location_snapshots");expect(source).not.toContain("geo_locations")});
 it("uses booking lifecycle status for booking-only GPS access",()=>{expect(source).toContain("b.status AS booking_status");expect(source).toContain("hasBookingNavigationAccess(row.booking_status)")});
 it("does not gate navigation on payment status",()=>{expect(source).not.toContain("payment_status");expect(source).not.toContain("PAID")});
});