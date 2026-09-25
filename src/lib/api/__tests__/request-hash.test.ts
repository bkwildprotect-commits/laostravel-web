import {describe,it,expect} from "vitest";import {canonicalBookingPayload,bookingRequestHash} from "../request-hash";
describe("canonical booking request hash",()=>{
 it("is independent of object key order",async()=>{const a={serviceId:"s1",quantity:1,traveller:{email:"a@b.com",name:"A"}};const b={quantity:1,traveller:{name:"A",email:"a@b.com"},serviceId:"s1"};expect(canonicalBookingPayload(a)).toBe(canonicalBookingPayload(b));expect(await bookingRequestHash(a)).toBe(await bookingRequestHash(b))});
 it("changes when booking semantics change",async()=>expect(await bookingRequestHash({serviceId:"s1",quantity:1})).not.toBe(await bookingRequestHash({serviceId:"s1",quantity:2})));
});
