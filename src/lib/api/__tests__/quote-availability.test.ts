import {describe,it,expect} from "vitest";
import {validateAvailabilityQuote} from "../quote-validation";
const base={serviceId:"s1",date:"2030-01-01",quantity:1};
describe("departure-specific quote validation",()=>{
 it("retains backward-compatible date selection",()=>expect(validateAvailabilityQuote(base).ok).toBe(true));
 it("accepts a selected availability UUID",()=>expect(validateAvailabilityQuote({...base,availabilityId:"123e4567-e89b-42d3-a456-426614174000"}).ok).toBe(true));
 it.each(["", "wrong", 3, null])("rejects invalid availability id %s",availabilityId=>expect(validateAvailabilityQuote({...base,availabilityId}).ok).toBe(false));
});
