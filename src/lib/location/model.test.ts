import {describe,expect,it} from "vitest";
import {canExposeLocation,hasBookingNavigationAccess,isValidCoordinates,navigationUrl} from "./model";

describe("geo location policy",()=>{
 it("accepts valid Lao coordinates and rejects invalid latitude/longitude",()=>{
  expect(isValidCoordinates({latitude:18.9236,longitude:102.4478})).toBe(true);
  expect(isValidCoordinates({latitude:91,longitude:102.4478})).toBe(false);
  expect(isValidCoordinates({latitude:18.9236,longitude:181})).toBe(false);
 });
 it("never exposes private or unverified pins",()=>{
  expect(canExposeLocation({visibility:"PRIVATE",verificationStatus:"VERIFIED",hasBookingAccess:true})).toBe(false);
  expect(canExposeLocation({visibility:"PUBLIC",verificationStatus:"PENDING",hasBookingAccess:true})).toBe(false);
 });
 it("allows public verified locations and gates booking-only locations",()=>{
  expect(canExposeLocation({visibility:"PUBLIC",verificationStatus:"VERIFIED",hasBookingAccess:false})).toBe(true);
  expect(canExposeLocation({visibility:"BOOKING_ONLY",verificationStatus:"VERIFIED",hasBookingAccess:false})).toBe(false);
  expect(canExposeLocation({visibility:"BOOKING_ONLY",verificationStatus:"VERIFIED",hasBookingAccess:true})).toBe(true);
 });
 it("allows booking-only navigation only for confirmed or completed bookings",()=>{
  expect(hasBookingNavigationAccess("PENDING")).toBe(false);
  expect(hasBookingNavigationAccess("CONFIRMED")).toBe(true);
  expect(hasBookingNavigationAccess("COMPLETED")).toBe(true);
  expect(hasBookingNavigationAccess("CANCELLED")).toBe(false);
  expect(hasBookingNavigationAccess("EXPIRED")).toBe(false);
  expect(hasBookingNavigationAccess("NO_SHOW")).toBe(false);
 });
 it("builds navigation without coupling navigation to payment state",()=>{
  expect(navigationUrl({latitude:18.9236,longitude:102.4478})).toBe("https://www.google.com/maps/dir/?api=1&destination=18.9236,102.4478");
 });
});
