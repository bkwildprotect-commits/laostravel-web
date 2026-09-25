import type {TransactionContext} from "@/lib/infrastructure/transaction";
export interface BookingTransactionRepository{
 claimIdempotency(tx:TransactionContext,userId:string,key:string,requestHash:string):Promise<"CLAIMED"|"REPLAY"|"CONFLICT"|"IN_PROGRESS">;
 lockAvailability(tx:TransactionContext,availabilityId:string):Promise<{remaining:number|null}>;
 reserveInventory(tx:TransactionContext,availabilityId:string,quantity:number):Promise<string>;
 lockPartnerTrial(tx:TransactionContext,partnerId:string):Promise<void>;
 createBooking(tx:TransactionContext,input:{userId:string;serviceId:string;quantity:number}):Promise<{bookingId:string;bookingRef:string}>;
 writeAudit(tx:TransactionContext,input:{actorUserId:string;action:string;targetType:string;targetId:string}):Promise<void>;
}
