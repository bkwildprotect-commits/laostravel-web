import {describe,it,expect} from "vitest";import {transitionBooking,trialActionForTransition} from "../lifecycle";
describe("booking lifecycle",()=>{
 it("completes confirmed booking and consumes reserved trial",()=>{expect(transitionBooking("CONFIRMED","COMPLETE")).toBe("COMPLETED");expect(trialActionForTransition("RESERVED","COMPLETED")).toBe("CONSUME")});
 it("releases trial on cancellation",()=>expect(trialActionForTransition("RESERVED","CANCELLED")).toBe("RELEASE"));
 it("releases trial on expiry",()=>expect(trialActionForTransition("RESERVED","EXPIRED")).toBe("RELEASE"));
 it("does not count no-show as a free booking",()=>expect(trialActionForTransition("RESERVED","NO_SHOW")).toBe("RELEASE"));
 it("rejects invalid transitions",()=>expect(()=>transitionBooking("COMPLETED","CANCEL")).toThrow());
});
