import {describe,it,expect} from "vitest";import {bookingHashPayload} from "../booking-hash-payload";
describe("booking hash allow-list",()=>{
 it("normalizes identity and coupon fields",()=>{const p=bookingHashPayload({serviceId:"s1",availabilityToken:"a",priceQuoteId:"q",quantity:1,traveller:{name:" A ","email":"USER@MAIL.COM "},couponCode:" save10 ",pointsToRedeem:"100",idempotencyKey:"secret-key"});expect(p.traveller).toEqual({name:"A",email:"user@mail.com"});expect(p.couponCode).toBe("SAVE10");expect(p).not.toHaveProperty("idempotencyKey")});
});
