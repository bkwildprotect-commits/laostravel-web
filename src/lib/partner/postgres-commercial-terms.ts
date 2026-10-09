import {assertPartnerReadyToSell} from "./postgres-sellability";
import type {TransactionContext} from "@/lib/infrastructure/transaction";
export async function activatePartnerLaunchFreePeriod(tx:TransactionContext,input:{partnerId:string;actorUserId:string}){
 const partners=await tx.query<{verification_status:string;business_status:string}>("SELECT verification_status,business_status FROM partners WHERE id=$1 FOR UPDATE",[input.partnerId]);
 const partner=partners[0];if(!partner||partner.verification_status!=="APPROVED"||partner.business_status!=="ACTIVE")throw new Error("PARTNER_NOT_ELIGIBLE_FOR_ACTIVATION");
 await assertPartnerReadyToSell(tx,input.partnerId);
 const existing=await tx.query<{model:string}>("SELECT model FROM partner_commercial_terms WHERE partner_id=$1 FOR UPDATE",[input.partnerId]);
 if(existing[0])throw new Error("PARTNER_COMMERCIAL_TERMS_ALREADY_EXIST");
 await tx.execute("INSERT INTO partner_commercial_terms(partner_id,model,free_started_at,free_ends_at,activated_by_user_id) VALUES($1,'LAUNCH_FREE',now(),now()+interval '6 months',$2)",[input.partnerId,input.actorUserId]);
 await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'PARTNER_LAUNCH_FREE_ACTIVATED','partner',$2,jsonb_build_object('duration','6 calendar months'))",[input.actorUserId,input.partnerId]);
}
