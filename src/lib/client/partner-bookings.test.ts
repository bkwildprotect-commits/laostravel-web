import {describe,it,expect} from "vitest";
import {parsePartnerBookings} from "./partner-bookings";
const row={bookingId:"b",bookingRef:"LT-B",serviceId:"s",status:"EXPIRED",paymentStatus:"UNPAID",commercialPath:"LAUNCH_FREE",currency:"LAK",customerTotal:"100",quantity:1,createdAt:"2030-01-01"};
describe("Partner UI authoritative response",()=>{
 it("accepts shared EXPIRED and LAUNCH_FREE states",()=>expect(parsePartnerBookings([row])).toEqual([row]));
 it.each([{status:"PAID"},{paymentStatus:"COMPLETED"},{commercialPath:"TRIAL_FREE"},{currency:"USD"},{customerTotal:"1.2"},{quantity:0},{createdAt:"bad"}])("rejects corrupt data without a fallback",change=>expect(()=>parsePartnerBookings([{...row,...change}])).toThrow());
});
