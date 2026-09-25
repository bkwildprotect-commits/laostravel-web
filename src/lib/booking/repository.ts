import type {TransactionContext} from "@/lib/infrastructure/transaction";
export type CommercialAllocation={path:"TRIAL_FREE";ordinal:number}|{path:"COMMISSIONABLE";ruleVersion:string};
export interface BookingTransactionRepository{
 claimIdempotency(tx:TransactionContext,userId:string,key:string,requestHash:string):Promise<"CLAIMED"|"REPLAY"|"CONFLICT"|"IN_PROGRESS">;
 getCompletedIdempotentBooking(tx:TransactionContext,userId:string,key:string):Promise<{bookingId:string;bookingRef:string}|null>;
 lockAvailability(tx:TransactionContext,availabilityId:string):Promise<{remaining:number|null}>;
 reserveInventory(tx:TransactionContext,availabilityId:string,quantity:number):Promise<{remaining:number|null;version:number}>;
 lockPartnerTrial(tx:TransactionContext,partnerId:string):Promise<void>;
 allocateCommercialPath(tx:TransactionContext,input:{partnerId:string}):Promise<CommercialAllocation>;
 createBooking(tx:TransactionContext,input:{userId:string;partnerId:string;serviceId:string;availabilityId:string;quantity:number;commercial:CommercialAllocation}):Promise<{bookingId:string;bookingRef:string}>;
 attachInventoryToBooking(tx:TransactionContext,input:{bookingId:string;availabilityId:string;quantity:number}):Promise<void>;
 completeIdempotency(tx:TransactionContext,input:{userId:string;key:string;bookingId:string}):Promise<void>;
 writeAudit(tx:TransactionContext,input:{actorUserId:string;action:string;targetType:string;targetId:string}):Promise<void>;
}
