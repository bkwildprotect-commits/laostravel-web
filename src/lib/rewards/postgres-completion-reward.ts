import type {TransactionContext} from "../infrastructure/transaction";
export class CompletionRewardError extends Error{
 constructor(public code:"BOOKING_NOT_ELIGIBLE"|"INVALID_POINTS"){super(code)}
}
export async function grantCompletionReward(tx:TransactionContext,input:{bookingId:string;userId:string;points:number}){
 if(!Number.isSafeInteger(input.points)||input.points<=0)throw new CompletionRewardError("INVALID_POINTS");
 const eligible=await tx.query<{ok:boolean}>("SELECT EXISTS(SELECT 1 FROM bookings WHERE id=$1 AND user_id=$2 AND status='COMPLETED') ok",[input.bookingId,input.userId]);
 if(!eligible[0]?.ok)throw new CompletionRewardError("BOOKING_NOT_ELIGIBLE");
 // The partial unique index arbitrates concurrent requests; a pre-insert
 // existence check cannot make the operation idempotent under contention.
 const result=await tx.execute("INSERT INTO points_ledger(id,user_id,booking_id,type,points) VALUES(gen_random_uuid(),$1,$2,'EARN',$3) ON CONFLICT(user_id,booking_id) WHERE booking_id IS NOT NULL AND type='EARN' DO NOTHING",[input.userId,input.bookingId,BigInt(input.points)]);
 if(result.rowCount===0)return {granted:false as const,reason:"ALREADY_GRANTED" as const};
 return {granted:true as const};
}
