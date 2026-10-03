import type {Pool} from "pg";
export class CommercialTermsAccessDeniedError extends Error{}
export async function getPartnerCommercialTerms(pool:Pool,input:{userId:string;partnerId:string}){
 const r=await pool.query<{model:string;free_started_at:Date|null;free_ends_at:Date|null}>("SELECT pct.model,pct.free_started_at,pct.free_ends_at FROM partner_members pm JOIN partner_commercial_terms pct ON pct.partner_id=pm.partner_id WHERE pm.partner_id=$1 AND pm.user_id=$2",[input.partnerId,input.userId]);if(!r.rows[0])throw new CommercialTermsAccessDeniedError();const x=r.rows[0];return {model:x.model,freeStartedAt:x.free_started_at?.toISOString()??null,freeEndsAt:x.free_ends_at?.toISOString()??null,commissionRateBps:x.model==="LAUNCH_FREE"?0:null};
}