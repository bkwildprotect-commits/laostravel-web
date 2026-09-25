import type {BookingStatus} from "@/lib/booking/lifecycle";
export type PaymentRequirement="PAY_NOW"|"PAY_LATER"|"PAY_AT_PARTNER";
export type PaymentStatus="PENDING"|"AUTHORIZED"|"PAID"|"FAILED"|"CANCELLED";
export type ConfirmationDecision={allowed:true}|{allowed:false;code:"PAYMENT_NOT_VERIFIED"|"INVALID_BOOKING_STATE"};
export function canConfirmBooking(input:{bookingStatus:BookingStatus;requirement:PaymentRequirement;paymentStatus:PaymentStatus}):ConfirmationDecision{
 if(input.bookingStatus!=="PENDING")return {allowed:false,code:"INVALID_BOOKING_STATE"};
 if(input.requirement==="PAY_NOW"&&input.paymentStatus!=="PAID")return {allowed:false,code:"PAYMENT_NOT_VERIFIED"};
 return {allowed:true};
}
export function shouldReleaseActiveHoldForPayment(input:{requirement:PaymentRequirement;paymentStatus:PaymentStatus}):boolean{
 return input.requirement==="PAY_NOW"&&(input.paymentStatus==="FAILED"||input.paymentStatus==="CANCELLED");
}
