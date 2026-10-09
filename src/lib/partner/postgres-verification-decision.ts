import type {Pool} from "pg";
export type PartnerVerificationDecision="APPROVED"|"REJECTED"|"SUSPENDED";
export class PartnerVerificationNotReadyError extends Error{constructor(public missing:string[]){super("PARTNER_VERIFICATION_NOT_READY")}}
export class PartnerVerificationNotFoundError extends Error{constructor(){super("PARTNER_NOT_FOUND")}}
export async function decidePartnerVerification(pool:Pool,input:{partnerId:string;actorUserId:string;decision:PartnerVerificationDecision}){
 const client=await pool.connect();try{
  await client.query("BEGIN");
  const partner=await client.query<{verification_status:string}>("SELECT verification_status FROM partners WHERE id=$1 FOR UPDATE",[input.partnerId]);
  if(!partner.rows[0])throw new PartnerVerificationNotFoundError();
  if(input.decision==="APPROVED"){
   const missing=await client.query<{document_type:string}>(`
    SELECT r.document_type FROM partner_verification_requirements r
    WHERE r.required=true AND r.active=true AND NOT EXISTS(
      SELECT 1 FROM partner_verification_documents d
      WHERE d.partner_id=$1 AND d.document_type=r.document_type AND d.status='APPROVED'
        AND (d.expires_at IS NULL OR d.expires_at>=CURRENT_DATE)
    ) ORDER BY r.document_type
   `,[input.partnerId]);
   if(missing.rows.length)throw new PartnerVerificationNotReadyError(missing.rows.map(x=>x.document_type));
  }
  await client.query("UPDATE partners SET verification_status=$2 WHERE id=$1",[input.partnerId,input.decision]);
  await client.query("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'PARTNER_VERIFICATION_DECIDED','partner',$2,jsonb_build_object('fromStatus',$3::text,'toStatus',$4::text))",[input.actorUserId,input.partnerId,partner.rows[0].verification_status,input.decision]);
  await client.query("COMMIT");return {status:input.decision};
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
