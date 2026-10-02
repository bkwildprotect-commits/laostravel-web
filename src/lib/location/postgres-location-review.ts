import type {Pool,PoolClient} from "pg";
import {randomUUID} from "node:crypto";
import type {GeoVerificationStatus} from "./model";

export type ReviewDecision="VERIFIED"|"REJECTED";
export class LocationReviewNotFoundError extends Error{constructor(){super("LOCATION_REVIEW_NOT_FOUND")}}
export class LocationReviewConflictError extends Error{constructor(){super("LOCATION_REVIEW_CONFLICT")}}

export type PendingLocationReview={id:string;kind:string;partnerId:string|null;serviceId:string|null;name:string;area:string;latitude:number;longitude:number;verificationStatus:GeoVerificationStatus;updatedAt:string};

export async function listPendingLocationReviews(pool:Pool,limit=50):Promise<PendingLocationReview[]>{
 const safeLimit=Math.min(Math.max(Number.isSafeInteger(limit)?limit:50,1),100);
 const result=await pool.query<{
  id:string;kind:string;partner_id:string|null;service_id:string|null;name:string;area:string;latitude:string;longitude:string;verification_status:GeoVerificationStatus;updated_at:Date;
 }>("SELECT id,kind,partner_id,service_id,name,area,latitude,longitude,verification_status,updated_at FROM geo_locations WHERE verification_status='PENDING' ORDER BY updated_at ASC,id ASC LIMIT $1",[safeLimit]);
 return result.rows.map(r=>({id:r.id,kind:r.kind,partnerId:r.partner_id,serviceId:r.service_id,name:r.name,area:r.area,latitude:Number(r.latitude),longitude:Number(r.longitude),verificationStatus:r.verification_status,updatedAt:r.updated_at.toISOString()}));
}

export async function reviewLocation(client:PoolClient,input:{reviewerUserId:string;locationId:string;decision:ReviewDecision;expectedUpdatedAt:string}):Promise<void>{
 const result=await client.query<{id:string}>(`
  UPDATE geo_locations SET verification_status=$1,verified_by_user_id=$2,verified_at=CASE WHEN $1='VERIFIED' THEN now() ELSE NULL END,updated_at=now()
  WHERE id=$3 AND verification_status='PENDING' AND updated_at=$4::timestamptz
  RETURNING id
 `,[input.decision,input.reviewerUserId,input.locationId,input.expectedUpdatedAt]);
 if(!result.rows[0]){
  const exists=await client.query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM geo_locations WHERE id=$1) AS exists",[input.locationId]);
  if(!exists.rows[0]?.exists)throw new LocationReviewNotFoundError();
  throw new LocationReviewConflictError();
 }
 await client.query("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,'geo_location',$4,$5::jsonb)",[randomUUID(),input.reviewerUserId,input.decision==="VERIFIED"?"LOCATION_VERIFIED":"LOCATION_REJECTED",input.locationId,JSON.stringify({decision:input.decision,expectedUpdatedAt:input.expectedUpdatedAt})]);
}


export async function reviewLocationAtomically(pool:Pool,input:{reviewerUserId:string;locationId:string;decision:ReviewDecision;expectedUpdatedAt:string}):Promise<void>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  await reviewLocation(client,input);
  await client.query("COMMIT");
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
