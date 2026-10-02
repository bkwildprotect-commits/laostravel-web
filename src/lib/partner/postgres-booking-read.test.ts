import {describe,expect,it,vi} from "vitest";
import {listPartnerBookings,PartnerAccessDeniedError} from "./postgres-booking-read";
import type {Pool} from "pg";

const asPool=(query:ReturnType<typeof vi.fn>)=>({query} as unknown as Pool);

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
 it("maps only partner-facing booking fields",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:true}]}).mockResolvedValueOnce({rows:[{booking_id:"b1",booking_ref:"LT-1",status:"PENDING",payment_status:"PENDING",created_at:new Date("2030-01-01T00:00:00Z"),service_id:"s1",quantity:2,currency:"LAK",customer_total:"200000",commercial_path:"TRIAL_FREE"}]});
  const rows=await listPartnerBookings(asPool(query),{userId:"u",partnerId:"p"});
  expect(rows).toEqual([{bookingId:"b1",bookingRef:"LT-1",status:"PENDING",paymentStatus:"PENDING",createdAt:"2030-01-01T00:00:00.000Z",serviceId:"s1",quantity:2,currency:"LAK",customerTotal:"200000",commercialPath:"TRIAL_FREE"}]);
 });
});
