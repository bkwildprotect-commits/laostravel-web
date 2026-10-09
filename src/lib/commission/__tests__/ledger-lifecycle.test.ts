import {describe,it,expect} from "vitest";import {commissionActionForBooking} from "../ledger-lifecycle";
describe("commission ledger lifecycle",()=>{
 it.each(["UNPAID","REFUNDED","DISPUTED"])("never earns on %s",payment=>expect(commissionActionForBooking("COMPLETED","PENDING",payment,true)).toBe("NONE"));
 it("requires proven terms",()=>expect(commissionActionForBooking("COMPLETED","PENDING","PAID",false)).toBe("NONE"));
 it("earns pending commission only on completed booking",()=>expect(commissionActionForBooking("COMPLETED","PENDING","PAID",true)).toBe("EARN"));
 it("voids pending commission on cancellation",()=>expect(commissionActionForBooking("CANCELLED","PENDING")).toBe("VOID"));
 it("voids pending commission on expiry",()=>expect(commissionActionForBooking("EXPIRED","PENDING")).toBe("VOID"));
 it("does not invent a no-show commission policy",()=>expect(commissionActionForBooking("NO_SHOW","PENDING")).toBe("NONE"));
 it("does not re-earn settled commission",()=>expect(commissionActionForBooking("COMPLETED","SETTLED")).toBe("NONE"));
});
