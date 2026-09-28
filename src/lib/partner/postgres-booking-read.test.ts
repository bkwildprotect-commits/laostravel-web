import {describe,expect,it,vi} from "vitest";
import {listPartnerBookings,PartnerAccessDeniedError} from "./postgres-booking-read";

const allowed=()=>({rows:[{allowed:true}]});

describe("partner booking reader",()=>{
 it("checks membership before reading bookings scoped to the requested partner",async()=>{
  const query=vi.fn().mockResolvedValueOnce(allowed()).mockResolvedValueOnce({rows:[]});
  await listPartnerBookings({query} as any,{userId:"user-a",partnerId:"partner-a"});
  expect(query.mock.calls[0][0]).toContain("FROM partner_members WHERE partner_id=$1 AND user_id=$2");
  expect(query.mock.calls[0][1]).toEqual(["partner-a","user-a"]);
  const [sql,params]=query.mock.calls[1];
  expect(sql).toContain("FROM partner_members pm");
  expect(sql).toContain("pm.partner_id=$1 AND pm.user_id=$2");
  expect(params).toEqual(["partner-a","user-a",50]);
 });
 it("denies an outsider before reading any bookings",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{allowed:false}]});
  await expect(listPartnerBookings({query} as any,{userId:"user-outsider",partnerId:"partner-private"}))
   .rejects.toBeInstanceOf(PartnerAccessDeniedError);
  expect(query).toHaveBeenCalledTimes(1);
  expect(query.mock.calls[0][1]).toEqual(["partner-private","user-outsider"]);
 });
 it("caps page size to protect the shared database",async()=>{
  const query=vi.fn().mockResolvedValueOnce(allowed()).mockResolvedValueOnce({rows:[]});
  await listPartnerBookings({query} as any,{userId:"u",partnerId:"p",limit:1000});
  expect(query.mock.calls[1][1][2]).toBe(100);
 });
 it("maps only partner-facing booking fields",async()=>{
  const query=vi.fn().mockResolvedValueOnce(allowed()).mockResolvedValueOnce({rows:[{booking_id:"b1",booking_ref:"LT-1",status:"PENDING",payment_status:"PENDING",created_at:new Date("2030-01-01T00:00:00Z"),service_id:"s1",quantity:2,currency:"LAK",customer_total:"200000",commercial_path:"TRIAL_FREE"}]});
  const rows=await listPartnerBookings({query} as any,{userId:"u",partnerId:"p"});
  expect(rows).toEqual([{bookingId:"b1",bookingRef:"LT-1",status:"PENDING",paymentStatus:"PENDING",createdAt:"2030-01-01T00:00:00.000Z",serviceId:"s1",quantity:2,currency:"LAK",customerTotal:"200000",commercialPath:"TRIAL_FREE"}]);
 });
});
