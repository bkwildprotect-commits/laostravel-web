import {describe,expect,it,vi} from "vitest";
import {listPartnerBookings} from "./postgres-booking-read";

describe("partner booking reader",()=>{
 it("scopes every read to authenticated membership and requested partner",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[]});
  await listPartnerBookings({query} as any,{userId:"user-a",partnerId:"partner-a"});
  const [sql,params]=query.mock.calls[0];
  expect(sql).toContain("FROM partner_members pm");
  expect(sql).toContain("pm.partner_id=$1 AND pm.user_id=$2");
  expect(params).toEqual(["partner-a","user-a",50]);
 });
 it("returns no rows when authenticated user is not a member of the requested partner",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[]});
  const rows=await listPartnerBookings({query} as any,{userId:"user-outsider",partnerId:"partner-private"});
  expect(rows).toEqual([]);
  const [sql,params]=query.mock.calls[0];
  expect(sql).toContain("FROM partner_members pm");
  expect(sql).toContain("pm.partner_id=$1 AND pm.user_id=$2");
  expect(params.slice(0,2)).toEqual(["partner-private","user-outsider"]);
 });
 it("caps page size to protect the shared database",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[]});
  await listPartnerBookings({query} as any,{userId:"u",partnerId:"p",limit:1000});
  expect(query.mock.calls[0][1][2]).toBe(100);
 });
 it("maps only partner-facing booking fields",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[{booking_id:"b1",booking_ref:"LT-1",status:"PENDING",payment_status:"PENDING",created_at:new Date("2030-01-01T00:00:00Z"),service_id:"s1",quantity:2,currency:"LAK",customer_total:"200000",commercial_path:"TRIAL_FREE"}]});
  const rows=await listPartnerBookings({query} as any,{userId:"u",partnerId:"p"});
  expect(rows).toEqual([{bookingId:"b1",bookingRef:"LT-1",status:"PENDING",paymentStatus:"PENDING",createdAt:"2030-01-01T00:00:00.000Z",serviceId:"s1",quantity:2,currency:"LAK",customerTotal:"200000",commercialPath:"TRIAL_FREE"}]);
 });
});
