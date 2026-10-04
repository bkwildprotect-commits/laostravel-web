import type {Pool} from "pg";
import {randomUUID} from "node:crypto";

export type PartnerDocumentDecision="APPROVED"|"REJECTED";
export class PartnerVerificationDocumentNotFoundError extends Error{constructor(){super("PARTNER_VERIFICATION_DOCUMENT_NOT_FOUND")}}
export class PartnerVerificationDocumentConflictError extends Error{constructor(){super("PARTNER_VERIFICATION_DOCUMENT_CONFLICT")}}

export async function reviewPartnerVerificationDocument(pool:Pool,input:{reviewerUserId:string;documentId:string;decision:PartnerDocumentDecision}):Promise<void>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const result=await client.query<{partner_id:string}>(`
   UPDATE partner_verification_documents
   SET status=$1,reviewer_user_id=$2,reviewed_at=now()
   WHERE id=$3 AND status='PENDING'
   RETURNING partner_id
  `,[input.decision,input.reviewerUserId,input.documentId]);
  const row=result.rows[0];
  if(!row){
   const exists=await client.query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM partner_verification_documents WHERE id=$1) AS exists",[input.documentId]);
   if(!exists.rows[0]?.exists)throw new PartnerVerificationDocumentNotFoundError();
   throw new PartnerVerificationDocumentConflictError();
  }
  await client.query(
   "INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,'partner_verification_document',$4,$5::jsonb)",
   [randomUUID(),input.reviewerUserId,input.decision==="APPROVED"?"PARTNER_DOCUMENT_APPROVED":"PARTNER_DOCUMENT_REJECTED",input.documentId,JSON.stringify({partnerId:row.partner_id,decision:input.decision})]
  );
  await client.query("COMMIT");
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
