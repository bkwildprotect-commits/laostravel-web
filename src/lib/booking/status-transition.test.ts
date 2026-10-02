import {describe,expect,it} from "vitest";
import {assertBookingStatusTransition,InvalidBookingStatusTransitionError,type BookingStatus} from "./status-transition";

describe("authoritative booking status transitions",()=>{
 const valid:[BookingStatus,BookingStatus][]=[
  ["REQUESTED","CONFIRMED"],["REQUESTED","CANCELLED"],["REQUESTED","EXPIRED"],
  ["CONFIRMED","CHECKED_IN"],["CONFIRMED","CANCELLED"],["CONFIRMED","NO_SHOW"],["CHECKED_IN","IN_SERVICE"],["CHECKED_IN","COMPLETED"],["CHECKED_IN","CANCELLED"],["IN_SERVICE","COMPLETED"]
 ];
 for(const [from,to] of valid)it(`allows ${from} -> ${to}`,()=>expect(()=>assertBookingStatusTransition(from,to)).not.toThrow());
 const terminal:BookingStatus[]=["COMPLETED","CANCELLED","EXPIRED","NO_SHOW"];
 for(const from of terminal)for(const to of ["REQUESTED","CONFIRMED","CHECKED_IN","IN_SERVICE","COMPLETED","CANCELLED","EXPIRED","NO_SHOW"] as BookingStatus[])
  it(`rejects terminal ${from} -> ${to}`,()=>expect(()=>assertBookingStatusTransition(from,to)).toThrow(InvalidBookingStatusTransitionError));
 it("rejects skipping directly from requested to completed",()=>expect(()=>assertBookingStatusTransition("REQUESTED","COMPLETED")).toThrow(InvalidBookingStatusTransitionError));
 it("rejects no-show before confirmation",()=>expect(()=>assertBookingStatusTransition("REQUESTED","NO_SHOW")).toThrow(InvalidBookingStatusTransitionError));
});
