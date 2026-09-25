import type {AvailabilityQuote,CreateBookingRequest} from "@/lib/api/contracts";import {createPriceSnapshot,type PriceSnapshot} from "./snapshot";
export type AuthoritativeQuote=AvailabilityQuote&{availabilityId:string};
export class QuoteVerificationError extends Error{constructor(public code:string){super(code)}}
export type QuoteStore={getAuthoritativeQuote(priceQuoteId:string):Promise<AuthoritativeQuote|null>};
function sameOption(a?:string,b?:string){return (a??null)===(b??null)}
export async function verifyBookingQuote(store:QuoteStore,request:CreateBookingRequest,now=new Date()):Promise<{quote:AuthoritativeQuote;price:PriceSnapshot}>{
 const quote=await store.getAuthoritativeQuote(request.priceQuoteId);if(!quote)throw new QuoteVerificationError("PRICE_QUOTE_NOT_FOUND");
 if(Date.parse(quote.expiresAt)<=now.getTime())throw new QuoteVerificationError("PRICE_QUOTE_EXPIRED");
 if(quote.serviceId!==request.serviceId||quote.date!==request.date||quote.quantity!==request.quantity||!sameOption(quote.optionId,request.optionId))throw new QuoteVerificationError("PRICE_QUOTE_MISMATCH");
 if(quote.priceQuoteId!==request.priceQuoteId||quote.availabilityToken!==request.availabilityToken)throw new QuoteVerificationError("PRICE_QUOTE_TOKEN_MISMATCH");
 return {quote,price:createPriceSnapshot(quote)};
}
