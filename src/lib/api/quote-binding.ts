import type {AvailabilityQuote,CreateBookingRequest} from "./contracts";
export type QuoteBindingResult={ok:true}|{ok:false;code:"QUOTE_EXPIRED"|"QUOTE_MISMATCH"|"TOKEN_MISMATCH"};
export function verifyQuoteBinding(quote:AvailabilityQuote,booking:CreateBookingRequest,now=new Date()):QuoteBindingResult{
 if(Number.isNaN(Date.parse(quote.expiresAt))||new Date(quote.expiresAt).getTime()<=now.getTime())return {ok:false,code:"QUOTE_EXPIRED"};
 if(quote.availabilityToken!==booking.availabilityToken||quote.priceQuoteId!==booking.priceQuoteId)return {ok:false,code:"TOKEN_MISMATCH"};
 if(quote.serviceId!==booking.serviceId||quote.quantity!==booking.quantity||quote.date!==booking.date||(quote.optionId??null)!==(booking.optionId??null))return {ok:false,code:"QUOTE_MISMATCH"};
 return {ok:true};
}
