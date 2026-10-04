export const SHARED_BOOKING_STATUSES=["REQUESTED","CONFIRMED","CHECKED_IN","IN_SERVICE","COMPLETED","CANCELLED","EXPIRED","NO_SHOW"] as const;
export const SHARED_PAYMENT_STATUSES=["UNPAID","PAID","REFUNDED","DISPUTED"] as const;
export const SHARED_SERVICE_KINDS=["STAY","RESTAURANT","ATTRACTION","ACTIVITY","INTERCITY_TRANSPORT","SELF_DRIVE_RENTAL","GUIDED_TRIP","PRIVATE_TRANSFER"] as const;
export const SHARED_PUBLICATION_STATUSES=["DRAFT","SUBMITTED","APPROVED","PUBLISHED"] as const;
export const SHARED_COMMERCIAL_MODELS=["LAUNCH_FREE","AWAITING_NEW_TERMS","COMMISSION"] as const;
export type SharedBookingStatus=typeof SHARED_BOOKING_STATUSES[number];export type SharedPaymentStatus=typeof SHARED_PAYMENT_STATUSES[number];export type SharedServiceKind=typeof SHARED_SERVICE_KINDS[number];export type SharedPublicationStatus=typeof SHARED_PUBLICATION_STATUSES[number];export type SharedCommercialModel=typeof SHARED_COMMERCIAL_MODELS[number];
export interface SharedBookingCommercialView{bookingStatus:SharedBookingStatus;paymentStatus:SharedPaymentStatus;paymentMode:"PAY_AT_PARTNER";currency:"LAK";customerTotal:string;partnerDiscountAmount:string;commercialModel:SharedCommercialModel}
