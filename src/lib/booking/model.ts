export type BookingStep="selection"|"traveller"|"benefits"|"review"|"confirmation";
export type PaymentRequirement="PAY_NOW"|"PAY_LATER"|"PAY_AT_PARTNER";
export type BookingDraft={serviceId:string;date?:string;quantity?:number;optionId?:string;availabilityToken?:string;priceQuoteId?:string;couponCode?:string;pointsToRedeem?:number};
export const bookingSteps:BookingStep[]=["selection","traveller","benefits","review","confirmation"];
