export type SharedServiceKind="STAY"|"RESTAURANT"|"ATTRACTION"|"ACTIVITY"|"INTERCITY_TRANSPORT"|"SELF_DRIVE_RENTAL"|"GUIDED_TRIP"|"PRIVATE_TRANSFER";
export type PricingUnit="PER_BOOKING"|"PER_PERSON"|"PER_DAY"|"PER_HOUR"|"PRIVATE_GROUP";
export type GuideSellerType="LICENSED_GUIDE"|"TOUR_OPERATOR"|"TRAVEL_CREATOR";
export type PublicationStatus="DRAFT"|"SUBMITTED"|"APPROVED"|"PUBLISHED";
export function canPublishGuidedTrip(input:{publicationStatus:PublicationStatus;partnerApproved:boolean;commerciallyEligible:boolean;serviceAreaBookingEnabled:boolean;hasVerifiedMeetingPoint:boolean}):boolean{return input.publicationStatus==="APPROVED"&&input.partnerApproved&&input.commerciallyEligible&&input.serviceAreaBookingEnabled&&input.hasVerifiedMeetingPoint}
export function assertCapacity(input:{totalCapacity:number;requested:number}){if(!Number.isSafeInteger(input.totalCapacity)||input.totalCapacity<=0||!Number.isSafeInteger(input.requested)||input.requested<=0||input.requested>input.totalCapacity)throw new Error("INVALID_CAPACITY")}
