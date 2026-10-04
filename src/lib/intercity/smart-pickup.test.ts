import {describe,expect,it} from "vitest";
import {
 SmartPickupValidationError,
 canRequestSmartPickup,
 hasMeasuredDetour,
 nextSmartPickupStatus,
 validateSmartPickupPoint,
} from "./smart-pickup";

describe("shared smart pickup contract",()=>{
 it("accepts consented coordinates without inventing a label",()=>{
  expect(validateSmartPickupPoint({latitude:18.9237,longitude:102.4478})).toEqual({
   latitude:18.9237,longitude:102.4478,label:null,
  });
 });
 it("rejects invalid coordinates and oversized labels",()=>{
  expect(()=>validateSmartPickupPoint({latitude:91,longitude:102})).toThrow(SmartPickupValidationError);
  expect(()=>validateSmartPickupPoint({latitude:18,longitude:102,label:"x".repeat(161)})).toThrow(SmartPickupValidationError);
 });
 it("allows only confirmed VIP van bookings with operator approval",()=>{
  const eligible={bookingStatus:"CONFIRMED" as const,serviceKind:"INTERCITY_TRANSPORT",vehicleType:"VIP_VAN",enabled:true,requiresOperatorApproval:true};
  expect(canRequestSmartPickup(eligible)).toBe(true);
  expect(canRequestSmartPickup({...eligible,bookingStatus:"REQUESTED"})).toBe(false);
  expect(canRequestSmartPickup({...eligible,vehicleType:"BUS"})).toBe(false);
  expect(canRequestSmartPickup({...eligible,requiresOperatorApproval:false})).toBe(false);
 });
 it("separates traveller cancellation from operator decisions",()=>{
  expect(nextSmartPickupStatus({current:"PENDING",actor:"TRAVELLER",decision:"CANCEL"})).toBe("CANCELLED");
  expect(nextSmartPickupStatus({current:"PENDING",actor:"OPERATOR",decision:"ACCEPT"})).toBe("ACCEPTED");
  expect(nextSmartPickupStatus({current:"PENDING",actor:"OPERATOR",decision:"DECLINE"})).toBe("DECLINED");
  expect(()=>nextSmartPickupStatus({current:"PENDING",actor:"TRAVELLER",decision:"ACCEPT"})).toThrow(SmartPickupValidationError);
 });
 it("never treats missing routing measurements as an ETA",()=>{
  expect(hasMeasuredDetour({routeDetourM:null,routeDetourSeconds:null})).toBe(false);
  expect(hasMeasuredDetour({routeDetourM:1500,routeDetourSeconds:420})).toBe(true);
 });
});
