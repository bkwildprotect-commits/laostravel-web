import {describe,it,expect} from "vitest";import {decideCommissionEligibility,FREE_BOOKING_LIMIT} from "../trial";
describe("partner free booking trial",()=>{
 it("starts with ordinal 1",()=>expect(decideCommissionEligibility([])).toEqual({kind:"TRIAL_FREE",ordinal:1}));
 it("allocates first free ordinal",()=>expect(decideCommissionEligibility([{bookingId:"a",ordinal:1,status:"CONSUMED"},{bookingId:"b",ordinal:3,status:"RESERVED"}])).toEqual({kind:"TRIAL_FREE",ordinal:2}));
 it("becomes commissionable after five occupied slots",()=>{const e=Array.from({length:FREE_BOOKING_LIMIT},(_,i)=>({bookingId:String(i),ordinal:i+1,status:"CONSUMED" as const}));expect(decideCommissionEligibility(e)).toEqual({kind:"COMMISSIONABLE"})});
 it("reuses a released ordinal",()=>expect(decideCommissionEligibility([{bookingId:"a",ordinal:1,status:"RELEASED"}])).toEqual({kind:"TRIAL_FREE",ordinal:1}));
});
