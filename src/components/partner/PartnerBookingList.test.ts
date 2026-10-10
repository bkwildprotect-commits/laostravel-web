import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("PartnerBookingList lifecycle controls",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/components/partner/PartnerBookingList.tsx"),"utf8");
 it("offers only approved partner-facing actions for requested bookings",()=>{
  expect(source).toContain('if(status==="REQUESTED")return[{event:"CONFIRM"');
  expect(source).toContain('{event:"CANCEL",label:"ยกเลิก"}');
 });
 it("offers completion cancellation and no-show only after confirmation",()=>{
  expect(source).toContain('if(status==="CONFIRMED")return[{event:"CHECK_IN"');
  expect(source).toContain('{event:"MARK_NO_SHOW",label:"ลูกค้าไม่มา"}');
 });
 it("does not expose EXPIRE as a manual partner action",()=>{
  expect(source).not.toContain('event:"EXPIRE",label:');
 });
 it("sends lifecycle changes only through the protected status endpoint",()=>{
  expect(source).toContain('/status`,{event},true,"PATCH"');
  expect(source).toContain("connectedBackend.request");
  expect(source).toContain("connectedBackend.sharedContract");
 });
 it("disables the active booking action while mutation is in flight",()=>{
  expect(source).toContain("disabled={updating===b.bookingId}");
 });
});
