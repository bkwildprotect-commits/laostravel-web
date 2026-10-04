export const sharedContractVersion="2026-10-04.v1" as const;
export const bookingStatuses=["REQUESTED","CONFIRMED","CHECKED_IN","IN_SERVICE","COMPLETED","CANCELLED","EXPIRED","NO_SHOW"] as const;
export const paymentStatuses=["UNPAID","PAID","REFUNDED","DISPUTED"] as const;
export const paymentMethods=["PAY_AT_PARTNER"] as const;
export const partnerVerificationStatuses=["PENDING","APPROVED","REJECTED","SUSPENDED"] as const;
export const commercialModels=["LAUNCH_FREE","AWAITING_NEW_TERMS","COMMISSION"] as const;
export const serviceAreaStatuses=["REGISTRATION_ONLY","BOOKING_ENABLED","SUSPENDED"] as const;
export const serviceKinds=["STAY","RESTAURANT","ATTRACTION","ACTIVITY","INTERCITY_TRANSPORT","SELF_DRIVE_RENTAL","GUIDED_TRIP","PRIVATE_TRANSFER"] as const;
export const guidePublicationStatuses=["DRAFT","SUBMITTED","APPROVED","PUBLISHED"] as const;
export const launchPolicy={currency:"LAK",paymentMethod:"PAY_AT_PARTNER",freeCalendarMonths:6,launchFreeCommissionRateBps:0,commissionAfterExpiry:"REQUIRES_SEPARATELY_ACCEPTED_TERMS",organicRanking:"NO_PAY_TO_RANK"} as const;
export const authority={bookingLifecycle:"SERVER",paymentTruth:"SERVER",partnerVerification:"SERVER",commercialTerms:"SERVER",priceAndDiscount:"SERVER",inventory:"SERVER",serviceArea:"SERVER",verifiedReview:"SERVER",rewards:"SERVER",gpsVerification:"SERVER",displayCurrency:"CLIENT_PRESENTATION_ONLY"} as const;
export const mobileCompatibility={booking:{requested:"REQUESTED",confirmed:"CONFIRMED",checkedIn:"CHECKED_IN",inService:"IN_SERVICE",completed:"COMPLETED",cancelled:"CANCELLED",noShow:"NO_SHOW",missingOnMobile:["EXPIRED"]},partnerVerification:{pending:"PENDING",verified:"APPROVED",rejected:"REJECTED",suspended:"SUSPENDED"},serviceArea:{open:"BOOKING_ENABLED",comingSoon:"REGISTRATION_ONLY"}} as const;
export function getSharedContract(){return {version:sharedContractVersion,bookingStatuses,paymentStatuses,paymentMethods,partnerVerificationStatuses,commercialModels,serviceAreaStatuses,serviceKinds,guidePublicationStatuses,launchPolicy,authority,mobileCompatibility}}
