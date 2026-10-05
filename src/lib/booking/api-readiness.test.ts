import {describe,expect,it} from "vitest";
import {getBookingApiReadiness} from "./api-readiness";

const valid={
 DATABASE_URL:"postgres://user:password@db.internal/laostravel",
 BOOKING_HOLD_MINUTES:"20",
 AUTH_ISSUER_URL:"https://issuer.example/auth/v1",
 AUTH_AUDIENCE:"laostravel",
 BOOKING_API_APPROVED:"true",
};

describe("booking API readiness",()=>{
 it("accepts valid core configuration after explicit approval",()=>{
  expect(getBookingApiReadiness(valid)).toEqual({ready:true});
 });
 it("does not open for present but unusable values",()=>{
  expect(getBookingApiReadiness({
   ...valid,
   DATABASE_URL:"not-a-database-url",
   BOOKING_HOLD_MINUTES:"NaN",
   AUTH_ISSUER_URL:"http://issuer.example",
  })).toEqual({ready:false,missing:[
   "DATABASE_URL",
   "BOOKING_HOLD_MINUTES",
   "AUTH_ISSUER_URL",
  ]});
 });
 it("keeps the explicit owner approval gate independent",()=>{
  expect(getBookingApiReadiness({...valid,BOOKING_API_APPROVED:"false"}))
   .toEqual({ready:false,missing:["BOOKING_API_APPROVED"]});
 });
});
