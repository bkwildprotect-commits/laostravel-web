import {describe,expect,it} from "vitest";
import {inventoryHoldActionForBooking} from "../inventory-hold-lifecycle";

describe("inventory hold booking lifecycle",()=>{
 it("consumes an active hold when a requested booking is confirmed",()=>expect(inventoryHoldActionForBooking({bookingFrom:"REQUESTED",bookingTo:"CONFIRMED",hold:"ACTIVE"})).toBe("CONSUME"));
 it("releases an active hold when a requested booking is cancelled",()=>expect(inventoryHoldActionForBooking({bookingFrom:"REQUESTED",bookingTo:"CANCELLED",hold:"ACTIVE"})).toBe("RELEASE"));
 it("expires an active hold when a requested booking expires",()=>expect(inventoryHoldActionForBooking({bookingFrom:"REQUESTED",bookingTo:"EXPIRED",hold:"ACTIVE"})).toBe("EXPIRE"));
 it("releases confirmed cancellation for guarded database resale but never no-show",()=>{
  expect(inventoryHoldActionForBooking({bookingFrom:"CONFIRMED",bookingTo:"CANCELLED",hold:"CONSUMED"})).toBe("RELEASE");
  expect(inventoryHoldActionForBooking({bookingFrom:"CONFIRMED",bookingTo:"NO_SHOW",hold:"CONSUMED"})).toBe("NONE");
 });
 it("never mutates a hold that is no longer active",()=>expect(inventoryHoldActionForBooking({bookingFrom:"REQUESTED",bookingTo:"CONFIRMED",hold:"RELEASED"})).toBe("NONE"));
});
