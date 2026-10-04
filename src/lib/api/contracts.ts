export type ApiError={code:string;message:string;requestId?:string};
export type ApiResult<T>={data:T;error:null}|{data:null;error:ApiError};
export type Locale="en"|"lo"|"th"|"vi"|"zh"|"fr"|"ko";
export type MoneyAmount=string; // integer minor-unit value; avoids JavaScript number precision loss
export type ServiceSummary={id:string;category:string;name:string;locationLabel:string;bookingMode:"INFORMATION_ONLY"|"DATE_BASED"|"TIME_SLOT"|"CAPACITY"|"UNIT_BASED"};
export type AvailabilityQuoteRequest={serviceId:string;date:string;quantity:number;optionId?:string};
export type AvailabilityQuote={serviceId:string;date:string;quantity:number;optionId?:string;availabilityToken:string;priceQuoteId:string;currency:string;baseAmount:MoneyAmount;feesAmount:MoneyAmount;partnerDiscountAmount:MoneyAmount;couponAmount:MoneyAmount;pointsBenefitAmount:MoneyAmount;customerTotal:MoneyAmount;expiresAt:string};
export type CreateBookingRequest={serviceId:string;date:string;optionId?:string;availabilityToken:string;priceQuoteId:string;quantity:number;traveller:{name:string;email:string};couponCode?:string;pointsToRedeem?:number;idempotencyKey:string};
export type BookingResponse={id:string;bookingRef:string;status:"REQUESTED"|"CONFIRMED"|"CHECKED_IN"|"IN_SERVICE"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";paymentStatus:"UNPAID"|"PAID"|"REFUNDED"|"DISPUTED";currency:string;customerTotal:MoneyAmount};
export type IntercityVehicleType="VIP_VAN"|"BUS";
export type IntercityPickupPolicy=
 |{mode:"SMART_PICKUP_REQUEST";maxDetourMeters:number;requiresOperatorApproval:true}
 |{mode:"DESIGNATED_STOP_ONLY";maxDetourMeters:null;requiresOperatorApproval:false};
export type IntercityDesignatedStop={id:string;areaCode:string;name:string;role:"BOARDING"|"DROPOFF"|"BOTH";order:number;latitude:number;longitude:number};
export type IntercityDeparture={
 serviceId:string;availabilityId:string;partnerName:string;serviceName:string;vehicleType:IntercityVehicleType;
 origin:{code:string;name:string};destination:{code:string;name:string};departureAt:string;arrivalAt:string|null;remainingSeats:number;
 pricing:{currency:"LAK";unitAmount:MoneyAmount;partnerDiscountAmount:MoneyAmount;customerUnitTotal:MoneyAmount};
 designatedStops:IntercityDesignatedStop[];pickup:IntercityPickupPolicy;
};
export type IntercityDeparturesResponse={departures:IntercityDeparture[]};
