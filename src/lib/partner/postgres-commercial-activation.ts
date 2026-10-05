import type {TransactionContext} from "@/lib/infrastructure/transaction";
import {activatePartnerLaunchFreePeriod} from "./postgres-commercial-terms";

export class PartnerCommercialActivationError extends Error{
 constructor(public code:"PARTNER_NOT_FOUND"|"PARTNER_NOT_APPROVED"|"PARTNER_ALREADY_ACTIVE"){super(code)}
}

export async function activatePartnerCommercially(tx:TransactionContext,input:{partnerId:string;actorUserId:string}){
 const rows=await tx.query<{verification_status:string;business_status:string}>(
  "SELECT verification_status,business_status FROM partners WHERE id=$1 FOR UPDATE",[input.partnerId]
 );
 const partner=rows[0];
 if(!partner)throw new PartnerCommercialActivationError("PARTNER_NOT_FOUND");
 if(partner.verification_status!=="APPROVED")throw new PartnerCommercialActivationError("PARTNER_NOT_APPROVED");
 if(partner.business_status!=="DRAFT")throw new PartnerCommercialActivationError("PARTNER_ALREADY_ACTIVE");
 await tx.execute("UPDATE partners SET business_status='ACTIVE' WHERE id=$1",[input.partnerId]);
 await activatePartnerLaunchFreePeriod(tx,input);
 await tx.execute(
  "INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'PARTNER_COMMERCIALLY_ACTIVATED','partner',$2,jsonb_build_object('fromStatus','DRAFT','toStatus','ACTIVE'))",
  [input.actorUserId,input.partnerId]
 );
 return {businessStatus:"ACTIVE" as const,commercialModel:"LAUNCH_FREE" as const};
}
