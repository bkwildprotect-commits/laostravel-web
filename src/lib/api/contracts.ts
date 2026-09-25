export type ApiError={code:string;message:string;requestId?:string};
export type ApiResult<T>={data:T;error:null}|{data:null;error:ApiError};
export type Locale="en"|"lo"|"th"|"vi"|"zh"|"fr"|"ko";
export type ServiceSummary={id:string;category:string;name:string;locationLabel:string;bookingMode:"INFORMATION_ONLY"|"DATE_BASED"|"TIME_SLOT"|"CAPACITY"|"UNIT_BASED"};
export type AvailabilityQuoteRequest={serviceId:string;date:string;quantity:number;optionId?:string};
export type AvailabilityQuote={availabilityToken:string;priceQuoteId:string;currency:string;baseAmount:number;feesAmount:number;couponAmount:number;pointsBenefitAmount:number;customerTotal:number;expiresAt:string};
export type CreateBookingRequest={serviceId:string;availabilityToken:string;priceQuoteId:string;quantity:number;traveller:{name:string;email:string};couponCode?:string;pointsToRedeem?:number;idempotencyKey:string};
export type BookingResponse={id:string;bookingRef:string;status:"PENDING"|"CONFIRMED"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";paymentStatus:"PENDING"|"AUTHORIZED"|"PAID"|"FAILED"|"CANCELLED";currency:string;customerTotal:number};
