import {describe,it,expect} from "vitest";import {commissionActionForBooking} from "../ledger-lifecycle";
describe("commission ledger lifecycle",()=>{
 it("earns pending commission only on completed booking",()=>expect(commissionActionForBooking("COMPLETED","PENDING")).toBe("EARN"));
 it("voids pending commission on cancellation",()=>expect(commissionActionForBooking("CANCELLED","PENDING")).toBe("VOID"));
 it("voids pending commission on expiry",()=>expect(commissionActionForBooking("EXPIRED","PENDING")).toBe("VOID"));
 it("does not invent a no-show commission policy",()=>expect(commissionActionForBooking("NO_SHOW","PENDING")).toBe("NONE"));
 it("does not re-earn settled commission",()=>expect(commissionActionForBooking("COMPLETED","SETTLED")).toBe("NONE"));
});
