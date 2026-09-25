import type {CreateBookingRequest} from "./contracts";
export type BookingHashPayload={serviceId:string;availabilityToken:string;priceQuoteId:string;quantity:number;traveller:{name:string;email:string};couponCode?:string;pointsToRedeem?:string};
export function bookingHashPayload(req:CreateBookingRequest):BookingHashPayload{
 const out:BookingHashPayload={serviceId:req.serviceId,availabilityToken:req.availabilityToken,priceQuoteId:req.priceQuoteId,quantity:req.quantity,traveller:{name:req.traveller.name.trim(),email:req.traveller.email.trim().toLowerCase()}};
 if(req.couponCode)out.couponCode=req.couponCode.trim().toUpperCase();
 if(req.pointsToRedeem)out.pointsToRedeem=req.pointsToRedeem;
 return out;
}
