import {describe,expect,it,vi} from "vitest";
import {mutatePartnerBookingLifecycle,PartnerBookingMutationAccessDeniedError} from "./postgres-booking-lifecycle";

function poolWith(query:ReturnType<typeof vi.fn>){
 const client={query,release:vi.fn()};
 return {connect:vi.fn().mockResolvedValue(client)};
}
describe("partner booking lifecycle authorization",()=>{
 it("denies cross-partner mutation before booking state is read",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[{allowed:false}],rowCount:1})
   .mockResolvedValueOnce({rows:[],rowCount:null});
  await expect(mutatePartnerBookingLifecycle(poolWith(query) as any,{userId:"outsider",partnerId:"partner-a",bookingId:"booking-b",event:"COMPLETE"})).rejects.toBeInstanceOf(PartnerBookingMutationAccessDeniedError);
  expect(query.mock.calls.some(([sql])=>String(sql).includes("SELECT status FROM bookings"))).toBe(false);
  expect(query.mock.calls.some(([sql])=>String(sql)==="ROLLBACK")).toBe(true);
 });
 it("checks membership, partner and booking in the same authorization query",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[{allowed:false}],rowCount:1})
   .mockResolvedValueOnce({rows:[],rowCount:null});
  await expect(mutatePartnerBookingLifecycle(poolWith(query) as any,{userId:"u",partnerId:"p",bookingId:"b",event:"CANCEL"})).rejects.toThrow();
  const sql=String(query.mock.calls[2][0]);
  expect(sql).toContain("partner_members");
  expect(sql).toContain("partner_booking_commercial_paths");
  expect(query.mock.calls[2][1]).toEqual(["p","u","b"]);
 });
});
