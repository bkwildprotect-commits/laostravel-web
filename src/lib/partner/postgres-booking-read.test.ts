import {describe,expect,it,vi} from "vitest";
import {listPartnerBookings,PartnerAccessDeniedError,PartnerBookingContractError} from "./postgres-booking-read";
import type {Pool} from "pg";

const asPool=(query:ReturnType<typeof vi.fn>)=>({query} as unknown as Pool);
const row=()=>({booking_id:"b1",booking_ref:"LT-1",status:"REQUESTED",payment_status:"UNPAID",
 created_at:new Date("2030-01-01T00:00:00Z"),service_id:"s1",quantity:2,currency:"LAK",
 customer_total:"200000",commercial_path:"LAUNCH_FREE"});

describe("partner booking reader",()=>{
 it("scopes every read to authenticated membership and requested partner",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:true}]}).mockResolvedValueOnce({rows:[]});
  await listPartnerBookings(asPool(query),{userId:"user-a",partnerId:"partner-a"});
  const [membershipSql,membershipParams]=query.mock.calls[0];
  expect(membershipSql).toContain("partner_members");
  expect(membershipParams).toEqual(["partner-a","user-a"]);
  expect(query.mock.calls[1][1]).toEqual(["partner-a","user-a",50]);
 });
 it("denies authenticated users who are not members of the requested partner",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:false}]});
  await expect(listPartnerBookings(asPool(query),{userId:"user-outsider",partnerId:"partner-private"})).rejects.toBeInstanceOf(PartnerAccessDeniedError);
  expect(query).toHaveBeenCalledTimes(1);
 });
 it("caps page size to protect the shared database",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:true}]}).mockResolvedValueOnce({rows:[]});
  await listPartnerBookings(asPool(query),{userId:"u",partnerId:"p",limit:1000});
  expect(query.mock.calls[1][1][2]).toBe(100);
 });
 it("maps only validated partner-facing booking fields",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:true}]}).mockResolvedValueOnce({rows:[row()]});
  const rows=await listPartnerBookings(asPool(query),{userId:"u",partnerId:"p"});
  expect(rows).toEqual([{bookingId:"b1",bookingRef:"LT-1",status:"REQUESTED",paymentStatus:"UNPAID",
   createdAt:"2030-01-01T00:00:00.000Z",serviceId:"s1",quantity:2,currency:"LAK",
   customerTotal:"200000",commercialPath:"LAUNCH_FREE"}]);
 });
 it.each([
  ["booking status",{status:"UNPAID"}],
  ["payment status",{payment_status:"REQUESTED"}],
  ["currency",{currency:"USD"}],
  ["amount",{customer_total:"20.50"}],
  ["quantity",{quantity:0}],
  ["commercial path",{commercial_path:"COMMISSION"}],
  ["timestamp",{created_at:new Date("invalid")}],
 ])("fails closed for malformed %s",async(_label,change)=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:true}]})
   .mockResolvedValueOnce({rows:[{...row(),...change}]});
  await expect(listPartnerBookings(asPool(query),{userId:"u",partnerId:"p"}))
   .rejects.toBeInstanceOf(PartnerBookingContractError);
 });
});
