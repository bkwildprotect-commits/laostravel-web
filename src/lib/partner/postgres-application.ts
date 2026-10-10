import {createHash} from "node:crypto";
import type {Pool} from "pg";
import {partnerCategories,type PartnerCategory} from "./model";
import {PostgresTransactionAdapter} from "../infrastructure/postgres-transaction";
export type PartnerApplicationInput={category:string;businessName:string;contactName:string;email:string;phone:string;area:string;idempotencyKey?:string};
export class PartnerApplicationValidationError extends Error{constructor(public fields:string[]){super("PARTNER_APPLICATION_INVALID")}}
export class PartnerApplicationConflictError extends Error{constructor(public code:"IDEMPOTENCY_CONFLICT"|"REQUEST_IN_PROGRESS"){super(code)}}
export function validatePartnerApplication(input:unknown):PartnerApplicationInput {
 if(!input||typeof input!=="object"||Array.isArray(input))throw new PartnerApplicationValidationError(["application"]);
 const a=input as Record<string,unknown>,fields=["businessName","contactName","email","phone","area"] as const;
 const invalid:string[]=fields.filter(k=>typeof a[k]!=="string"||!(a[k] as string).trim()||(a[k] as string).length>512);
 if(typeof a.category!=="string"||!partnerCategories.includes(a.category as PartnerCategory))invalid.push("category");
 if(typeof a.email==="string"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()))invalid.push("email");
 if(a.idempotencyKey!==undefined&&(typeof a.idempotencyKey!=="string"||a.idempotencyKey.length<8||a.idempotencyKey.length>128))invalid.push("idempotencyKey");
 if(invalid.length)throw new PartnerApplicationValidationError(invalid);
 return {category:a.category as string,...Object.fromEntries(fields.map(k=>[k,(a[k] as string).trim()])) as Omit<PartnerApplicationInput,"category">,...(a.idempotencyKey===undefined?{}:{idempotencyKey:a.idempotencyKey as string})};
}
export async function submitPartnerApplication(pool:Pool,userId:string,input:unknown){
 const a=validatePartnerApplication(input);
 const payload={category:a.category,businessName:a.businessName,contactName:a.contactName,email:a.email,phone:a.phone,area:a.area};
 const hash=createHash("sha256").update(JSON.stringify(payload)).digest("hex");
 return new PostgresTransactionAdapter(pool).run("SERIALIZABLE",async tx=>{
  if(a.idempotencyKey){
   const existing=await tx.query<{request_hash:string;application_id:string|null}>("SELECT request_hash,application_id FROM partner_application_idempotency WHERE user_id=$1 AND idempotency_key=$2 FOR UPDATE",[userId,a.idempotencyKey]);
   if(existing[0]){
    if(existing[0].request_hash!==hash)throw new PartnerApplicationConflictError("IDEMPOTENCY_CONFLICT");
    if(!existing[0].application_id)throw new PartnerApplicationConflictError("REQUEST_IN_PROGRESS");
    return {applicationId:existing[0].application_id,status:"SUBMITTED" as const};
   }
   const claim=await tx.execute("INSERT INTO partner_application_idempotency(user_id,idempotency_key,request_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[userId,a.idempotencyKey,hash]);
   if(claim.rowCount!==1)throw new PartnerApplicationConflictError("REQUEST_IN_PROGRESS");
  }
  const rows=await tx.query<{id:string}>("INSERT INTO partner_applications(id,applicant_user_id,category,business_name,contact_name,email,phone,operating_area) VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7) RETURNING id",[userId,a.category,a.businessName,a.contactName,a.email,a.phone,a.area]);
  const id=rows[0].id;
  await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id) VALUES(gen_random_uuid(),$1,'PARTNER_APPLICATION_SUBMITTED','partner_application',$2)",[userId,id]);
  if(a.idempotencyKey)await tx.execute("UPDATE partner_application_idempotency SET application_id=$3 WHERE user_id=$1 AND idempotency_key=$2",[userId,a.idempotencyKey,id]);
  return {applicationId:id,status:"SUBMITTED" as const};
 });
}
