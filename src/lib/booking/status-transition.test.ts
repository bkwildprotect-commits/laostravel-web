import {describe,expect,it} from "vitest";
import {assertBookingStatusTransition,InvalidBookingStatusTransitionError,type BookingStatus} from "./status-transition";

describe("authoritative booking status transitions",()=>{
 const valid:[BookingStatus,BookingStatus][]=[
  ["PENDING","CONFIRMED"],["PENDING","CANCELLED"],["PENDING","EXPIRED"],
  ["CONFIRMED","COMPLETED"],["CONFIRMED","CANCELLED"],["CONFIRMED","NO_SHOW"]
 ];
 for(const [from,to] of valid)it(`allows ${from} -> ${to}`,()=>expect(()=>assertBookingStatusTransition(from,to)).not.toThrow());
 const terminal:BookingStatus[]=["COMPLETED","CANCELLED","EXPIRED","NO_SHOW"];
 for(const from of terminal)for(const to of ["PENDING","CONFIRMED","COMPLETED","CANCELLED","EXPIRED","NO_SHOW"] as BookingStatus[])
  it(`rejects terminal ${from} -> ${to}`,()=>expect(()=>assertBookingStatusTransition(from,to)).toThrow(InvalidBookingStatusTransitionError));
 it("rejects skipping directly from pending to completed",()=>expect(()=>assertBookingStatusTransition("PENDING","COMPLETED")).toThrow(InvalidBookingStatusTransitionError));
 it("rejects no-show before confirmation",()=>expect(()=>assertBookingStatusTransition("PENDING","NO_SHOW")).toThrow(InvalidBookingStatusTransitionError));
});
