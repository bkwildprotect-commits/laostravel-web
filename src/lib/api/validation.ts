import type {CreateBookingRequest} from "./contracts";
const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateCreateBooking(input:unknown):{ok:true;value:CreateBookingRequest}|{ok:false;errors:string[]}{
 const e:string[]=[]; if(!input||typeof input!=="object")return {ok:false,errors:["Invalid request body"]};
 const x=input as Partial<CreateBookingRequest>;
 if(!x.serviceId||typeof x.serviceId!=="string")e.push("serviceId is required");
 if(!x.date||typeof x.date!=="string"||Number.isNaN(Date.parse(x.date)))e.push("date must be a valid date");
 if(x.optionId!==undefined&&(typeof x.optionId!=="string"||!x.optionId.trim()))e.push("optionId must be a non-empty string when provided");
 if(!x.availabilityToken||typeof x.availabilityToken!=="string")e.push("availabilityToken is required");
 if(!x.priceQuoteId||typeof x.priceQuoteId!=="string")e.push("priceQuoteId is required");
 if(!Number.isInteger(x.quantity)||Number(x.quantity)<1||Number(x.quantity)>100)e.push("quantity must be an integer from 1 to 100");
 if(!x.traveller?.name?.trim())e.push("traveller.name is required");
 if(!x.traveller?.email||!email.test(x.traveller.email))e.push("traveller.email is invalid");
 if(x.couponCode!==undefined&&(typeof x.couponCode!=="string"||!x.couponCode.trim()||x.couponCode.trim().length>64))e.push("couponCode must be 1-64 characters when provided");
 if(x.pointsToRedeem!==undefined&&(!Number.isSafeInteger(x.pointsToRedeem)||Number(x.pointsToRedeem)<0))e.push("pointsToRedeem must be a non-negative safe integer");
 if(!x.idempotencyKey||typeof x.idempotencyKey!=="string"||x.idempotencyKey.length<8||x.idempotencyKey.length>128)e.push("idempotencyKey must be 8-128 characters");
 return e.length?{ok:false,errors:e}:{ok:true,value:x as CreateBookingRequest};
}
