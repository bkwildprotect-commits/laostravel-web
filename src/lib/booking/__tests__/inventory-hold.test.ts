import {describe,it,expect} from "vitest";import {canConsumeHold,shouldReleaseHold,transitionHold,type InventoryHold} from "../inventory-hold";
const hold:InventoryHold={id:"h1",serviceId:"s1",availabilityId:"a1",quantity:1,status:"ACTIVE",expiresAt:"2030-01-01T00:00:00Z"};
describe("inventory hold",()=>{
 it("consumes only an active unexpired hold",()=>expect(canConsumeHold(hold,new Date("2029-01-01T00:00:00Z"))).toBe(true));
 it("rejects an expired hold",()=>expect(canConsumeHold(hold,new Date("2031-01-01T00:00:00Z"))).toBe(false));
 it("rejects released holds",()=>expect(canConsumeHold({...hold,status:"RELEASED"},new Date("2029-01-01T00:00:00Z"))).toBe(false));
 it("consumes active hold once",()=>expect(transitionHold(hold,"CONSUME",new Date("2029-01-01"))).toBe("CONSUMED"));
 it("times out active hold",()=>expect(transitionHold(hold,"TIMEOUT",new Date("2031-01-01"))).toBe("EXPIRED"));
 it("prevents double finalization",()=>expect(()=>transitionHold({...hold,status:"RELEASED"},"RELEASE",new Date("2029-01-01"))).toThrow("HOLD_ALREADY_FINALIZED"));
 it("prevents consuming expired active hold",()=>expect(()=>transitionHold(hold,"CONSUME",new Date("2031-01-01"))).toThrow("HOLD_EXPIRED"));
 it.each(["CANCELLED","EXPIRED","FAILED_PAYMENT","QUOTE_EXPIRED"] as const)("releases for %s",reason=>expect(shouldReleaseHold(reason)).toBe(true));
});
