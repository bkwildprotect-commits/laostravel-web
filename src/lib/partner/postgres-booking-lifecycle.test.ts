import {describe,expect,it,vi} from "vitest";
import type {PgPoolLike} from "../infrastructure/postgres-transaction";
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
  await expect(mutatePartnerBookingLifecycle(poolWith(query) as unknown as PgPoolLike,{userId:"outsider",partnerId:"partner-a",bookingId:"booking-b",event:"COMPLETE"})).rejects.toBeInstanceOf(PartnerBookingMutationAccessDeniedError);
  expect(query.mock.calls.some(([sql])=>String(sql).includes("SELECT status FROM bookings"))).toBe(false);
  expect(query.mock.calls.some(([sql])=>String(sql)==="ROLLBACK")).toBe(true);
 });
 it("checks membership, partner and booking in the same authorization query",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[{allowed:false}],rowCount:1})
   .mockResolvedValueOnce({rows:[],rowCount:null});
  await expect(mutatePartnerBookingLifecycle(poolWith(query) as unknown as PgPoolLike,{userId:"u",partnerId:"p",bookingId:"b",event:"CANCEL"})).rejects.toThrow();
  const sql=String(query.mock.calls[2][0]);
  expect(sql).toContain("partner_members");
  expect(sql).toContain("partner_booking_commercial_paths");
  expect(query.mock.calls[2][1]).toEqual(["p","u","b"]);
 });
 it("passes the authenticated partner member as the lifecycle audit actor",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[],rowCount:null})
   .mockResolvedValueOnce({rows:[{allowed:true}],rowCount:1})
   .mockResolvedValueOnce({rows:[{status:"IN_SERVICE"}],rowCount:1})
   .mockResolvedValueOnce({rows:[],rowCount:0})
   .mockResolvedValueOnce({rows:[],rowCount:0})
   .mockResolvedValueOnce({rows:[],rowCount:0})
   .mockResolvedValue({rows:[],rowCount:1});
  await expect(mutatePartnerBookingLifecycle(poolWith(query) as unknown as PgPoolLike,{userId:"member-1",partnerId:"partner-1",bookingId:"booking-1",event:"COMPLETE"})).resolves.toEqual({status:"COMPLETED"});
  const audit=query.mock.calls.find(([sql])=>String(sql).includes("INSERT INTO audit_logs"));
  expect(audit?.[1]?.[0]).toBe("member-1");
 });

});
