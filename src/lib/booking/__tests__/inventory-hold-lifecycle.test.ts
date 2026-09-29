import {describe,expect,it} from "vitest";
import {inventoryHoldActionForBooking} from "../inventory-hold-lifecycle";

describe("inventory hold booking lifecycle",()=>{
 it("consumes an active hold when a pending booking is confirmed",()=>expect(inventoryHoldActionForBooking({bookingFrom:"PENDING",bookingTo:"CONFIRMED",hold:"ACTIVE"})).toBe("CONSUME"));
 it("releases an active hold when a pending booking is cancelled",()=>expect(inventoryHoldActionForBooking({bookingFrom:"PENDING",bookingTo:"CANCELLED",hold:"ACTIVE"})).toBe("RELEASE"));
 it("expires an active hold when a pending booking expires",()=>expect(inventoryHoldActionForBooking({bookingFrom:"PENDING",bookingTo:"EXPIRED",hold:"ACTIVE"})).toBe("EXPIRE"));
 it("does not invent post-confirmation inventory restoration policy",()=>{
  expect(inventoryHoldActionForBooking({bookingFrom:"CONFIRMED",bookingTo:"CANCELLED",hold:"CONSUMED"})).toBe("NONE");
  expect(inventoryHoldActionForBooking({bookingFrom:"CONFIRMED",bookingTo:"NO_SHOW",hold:"CONSUMED"})).toBe("NONE");
 });
 it("never mutates a hold that is no longer active",()=>expect(inventoryHoldActionForBooking({bookingFrom:"PENDING",bookingTo:"CONFIRMED",hold:"RELEASED"})).toBe("NONE"));
});
