import {describe,it,expect} from "vitest";import {validateCreateBooking} from "../validation";
const valid={serviceId:"s1",date:"2030-01-01",availabilityToken:"a1",priceQuoteId:"q1",quantity:1,traveller:{name:"A",email:"a@example.com"},idempotencyKey:"12345678"};
describe("create booking validation",()=>{
 it("accepts zero points without treating it as missing",()=>expect(validateCreateBooking({...valid,pointsToRedeem:0}).ok).toBe(true));
 it("rejects negative points",()=>expect(validateCreateBooking({...valid,pointsToRedeem:-1}).ok).toBe(false));
 it("rejects fractional points",()=>expect(validateCreateBooking({...valid,pointsToRedeem:1.5}).ok).toBe(false));
 it("accepts a UUID designated stop",()=>expect(validateCreateBooking({...valid,designatedStopId:"123e4567-e89b-42d3-a456-426614174000"}).ok).toBe(true));
 it("rejects a non-UUID designated stop",()=>expect(validateCreateBooking({...valid,designatedStopId:"station-name"}).ok).toBe(false));
 it("rejects blank coupon",()=>expect(validateCreateBooking({...valid,couponCode:"   "}).ok).toBe(false));
});
