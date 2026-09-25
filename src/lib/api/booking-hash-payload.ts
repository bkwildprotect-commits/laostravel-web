import type {CreateBookingRequest} from "./contracts";
export type BookingHashPayload={serviceId:string;date:string;optionId?:string;availabilityToken:string;priceQuoteId:string;quantity:number;traveller:{name:string;email:string};couponCode?:string;pointsToRedeem?:number};
export function bookingHashPayload(req:CreateBookingRequest):BookingHashPayload{
 const out:BookingHashPayload={serviceId:req.serviceId,date:req.date,availabilityToken:req.availabilityToken,priceQuoteId:req.priceQuoteId,quantity:req.quantity,traveller:{name:req.traveller.name.trim(),email:req.traveller.email.trim().toLowerCase()}};
 if(req.optionId)out.optionId=req.optionId.trim();
 if(req.couponCode)out.couponCode=req.couponCode.trim().toUpperCase();
 if(req.pointsToRedeem!==undefined)out.pointsToRedeem=req.pointsToRedeem;
 return out;
}
