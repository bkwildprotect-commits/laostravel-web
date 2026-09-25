import type {TransactionContext} from "@/lib/infrastructure/transaction";
export interface RewardTransactionRepository{
 lockUserPoints(tx:TransactionContext,userId:string):Promise<void>;
 getAvailablePoints(tx:TransactionContext,userId:string):Promise<bigint>;
 redeemPoints(tx:TransactionContext,input:{userId:string;bookingId:string;points:bigint}):Promise<void>;
 claimCoupon(tx:TransactionContext,input:{userId:string;bookingId:string;couponCode:string;benefitAmount:bigint}):Promise<"CLAIMED"|"ALREADY_USED">;
}
export async function applyBookingRewards(tx:TransactionContext,repo:RewardTransactionRepository,input:{userId:string;bookingId:string;pointsToRedeem?:number;couponCode?:string;couponBenefitAmount?:string}){
 const points=BigInt(input.pointsToRedeem??0);
 if(points<BigInt(0))throw new Error("INVALID_POINTS");
 if(points>BigInt(0)){await repo.lockUserPoints(tx,input.userId);const available=await repo.getAvailablePoints(tx,input.userId);if(available<points)throw new Error("INSUFFICIENT_POINTS");await repo.redeemPoints(tx,{userId:input.userId,bookingId:input.bookingId,points});}
 if(input.couponCode){if(!/^\d+$/.test(input.couponBenefitAmount??""))throw new Error("INVALID_COUPON_BENEFIT");const claimed=await repo.claimCoupon(tx,{userId:input.userId,bookingId:input.bookingId,couponCode:input.couponCode.trim().toUpperCase(),benefitAmount:BigInt(input.couponBenefitAmount!)});if(claimed!=="CLAIMED")throw new Error("COUPON_ALREADY_USED");}
}
