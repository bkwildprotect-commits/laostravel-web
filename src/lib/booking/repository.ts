import type {TransactionContext} from "@/lib/infrastructure/transaction";
export type BookingPriceSnapshot={currency:string;baseAmount:string;feesAmount:string;partnerDiscountAmount:string;couponAmount:string;pointsBenefitAmount:string;customerTotal:string;priceQuoteId:string};
export type TransportPickupSelection=
 |{mode:"NOT_INTERCITY"|"VIP_VAN"}
 |{mode:"BUS_DESIGNATED_STOP";stop:{id:string;areaCode:string;nameLo:string;nameEn:string;role:"BOARDING"|"BOTH";order:number;latitude:string;longitude:string}};
export type CommercialAllocation={path:"LAUNCH_FREE";freeEndsAt:string}|{path:"COMMISSIONABLE";ruleVersion:string;acceptedTermsVersion?:string};
export interface BookingTransactionRepository{
 claimIdempotency(tx:TransactionContext,userId:string,key:string,requestHash:string):Promise<"CLAIMED"|"REPLAY"|"CONFLICT"|"IN_PROGRESS">;
 resolveBookingOwnership(tx:TransactionContext,input:{serviceId:string;availabilityId:string}):Promise<{partnerId:string}>;
 assertCommercialServiceArea(tx:TransactionContext,serviceId:string):Promise<void>;
 resolveTransportPickupSelection(tx:TransactionContext,input:{serviceId:string;designatedStopId?:string}):Promise<TransportPickupSelection>;
 getCompletedIdempotentBooking(tx:TransactionContext,userId:string,key:string):Promise<{bookingId:string;bookingRef:string}|null>;
 lockAvailability(tx:TransactionContext,availabilityId:string):Promise<{remaining:number|null}>;
 reserveInventory(tx:TransactionContext,availabilityId:string,quantity:number):Promise<{remaining:number|null;version:number}>;
 lockPartnerCommercialTerms(tx:TransactionContext,partnerId:string):Promise<void>;
 allocateCommercialPath(tx:TransactionContext,input:{partnerId:string}):Promise<CommercialAllocation>;
 createBooking(tx:TransactionContext,input:{userId:string;partnerId:string;serviceId:string;availabilityId:string;quantity:number;commercial:CommercialAllocation;price:BookingPriceSnapshot}):Promise<{bookingId:string;bookingRef:string}>;
 persistTransportPickupSelection(tx:TransactionContext,input:{bookingId:string;serviceId:string;selection:TransportPickupSelection}):Promise<void>;
 consumePriceQuote(tx:TransactionContext,input:{priceQuoteId:string;bookingId:string}):Promise<void>;
 persistCommercialPath(tx:TransactionContext,input:{bookingId:string;partnerId:string;commercial:CommercialAllocation;price:BookingPriceSnapshot}):Promise<void>;
 attachInventoryToBooking(tx:TransactionContext,input:{bookingId:string;availabilityId:string;quantity:number;holdMinutes:number}):Promise<void>;
 completeIdempotency(tx:TransactionContext,input:{userId:string;key:string;bookingId:string}):Promise<void>;
 writeAudit(tx:TransactionContext,input:{actorUserId:string;action:string;targetType:string;targetId:string}):Promise<void>;
}
