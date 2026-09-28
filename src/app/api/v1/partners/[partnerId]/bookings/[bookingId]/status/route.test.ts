import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("partner booking status API contract",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/app/api/v1/partners/[partnerId]/bookings/[bookingId]/status/route.ts"),"utf8");
 it("requires central authentication",()=>{
  expect(source).toContain("getRuntimeAuthenticationAdapter().authenticate(request)");
  expect(source).toContain("AuthenticationError");
  expect(source).toContain("status:error.code===\"AUTH_NOT_CONFIGURED\"?503:401");
 });
 it("allows only explicit lifecycle events",()=>{
  for(const event of ["CONFIRM","COMPLETE","CANCEL","EXPIRE","MARK_NO_SHOW"])expect(source).toContain(`"${event}"`);
  expect(source).toContain('code:"VALIDATION_ERROR"');
  expect(source).toContain("status:400");
 });
 it("maps cross-partner access denial to 403",()=>{
  expect(source).toContain("PartnerBookingMutationAccessDeniedError");
  expect(source).toContain('code:"PARTNER_BOOKING_MUTATION_ACCESS_DENIED"');
  expect(source).toContain("status:403");
 });
 it("maps lifecycle conflicts safely without leaking internals",()=>{
  expect(source).toContain('code:"INVALID_BOOKING_TRANSITION"');
  expect(source).toContain("status:409");
  expect(source).toContain('code:"INTERNAL_ERROR"');
  expect(source).toContain('message:"Booking status could not be updated."');
 });
});
