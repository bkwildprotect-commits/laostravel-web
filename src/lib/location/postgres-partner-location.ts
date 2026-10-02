import type {Pool,PoolClient} from "pg";
import {randomUUID} from "node:crypto";
import {isValidCoordinates,type GeoVisibility} from "./model";

export class LocationAccessDeniedError extends Error{constructor(){super("LOCATION_ACCESS_DENIED")}}
export class LocationValidationError extends Error{constructor(message:string){super(message)}}

export type PartnerLocationInput={name:string;area:string;latitude:number;longitude:number;accuracyMeters?:number|null;visibility?:GeoVisibility};
export type PartnerLocationRow={id:string;partnerId:string;name:string;area:string;latitude:number;longitude:number;accuracyMeters:number|null;verificationStatus:string;visibility:GeoVisibility};

function validate(input:PartnerLocationInput){
 if(!input.name.trim()||!input.area.trim())throw new LocationValidationError("Name and area are required");
 if(!isValidCoordinates(input))throw new LocationValidationError("Invalid GPS coordinates");
 if(input.accuracyMeters!==undefined&&input.accuracyMeters!==null&&(!Number.isSafeInteger(input.accuracyMeters)||input.accuracyMeters<0))throw new LocationValidationError("Invalid GPS accuracy");
 if(input.visibility&&!["PUBLIC","BOOKING_ONLY","PRIVATE"].includes(input.visibility))throw new LocationValidationError("Invalid visibility");
}

async function assertPartnerMember(db:Pool|PoolClient,userId:string,partnerId:string){
 const membership=await db.query<{allowed:boolean}>("SELECT EXISTS(SELECT 1 FROM partner_members WHERE partner_id=$1 AND user_id=$2) AS allowed",[partnerId,userId]);
 if(!membership.rows[0]?.allowed)throw new LocationAccessDeniedError();
}

export async function upsertPartnerVenue(pool:Pool,input:{userId:string;partnerId:string;location:PartnerLocationInput}):Promise<PartnerLocationRow>{
 validate(input.location);
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  await assertPartnerMember(client,input.userId,input.partnerId);
  const serviceCheck=await client.query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM partners WHERE id=$1) AS exists",[input.partnerId]);
  if(!serviceCheck.rows[0]?.exists)throw new LocationAccessDeniedError();
  const id=randomUUID(),visibility=input.location.visibility??"PUBLIC";
  const result=await client.query<{
   id:string;partner_id:string;name:string;area:string;latitude:string;longitude:string;accuracy_meters:number|null;verification_status:string;visibility:GeoVisibility;
  }>(`
   INSERT INTO geo_locations(id,kind,partner_id,name,area,latitude,longitude,accuracy_meters,source,verification_status,visibility)
   VALUES($1,'PARTNER_VENUE',$2,$3,$4,$5,$6,$7,'PARTNER_PIN','PENDING',$8)
   ON CONFLICT(partner_id) WHERE kind='PARTNER_VENUE' DO UPDATE SET
    name=EXCLUDED.name,area=EXCLUDED.area,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
    accuracy_meters=EXCLUDED.accuracy_meters,source='PARTNER_PIN',verification_status='PENDING',
    visibility=EXCLUDED.visibility,verified_by_user_id=NULL,verified_at=NULL,updated_at=now()
   RETURNING id,partner_id,name,area,latitude,longitude,accuracy_meters,verification_status,visibility
  `,[id,input.partnerId,input.location.name.trim(),input.location.area.trim(),input.location.latitude,input.location.longitude,input.location.accuracyMeters??null,visibility]);
  const row=result.rows[0];
  await client.query("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'PARTNER_LOCATION_SUBMITTED','geo_location',$3,$4::jsonb)",[randomUUID(),input.userId,row.id,JSON.stringify({partnerId:input.partnerId,verificationStatus:"PENDING"})]);
  await client.query("COMMIT");
  return {id:row.id,partnerId:row.partner_id,name:row.name,area:row.area,latitude:Number(row.latitude),longitude:Number(row.longitude),accuracyMeters:row.accuracy_meters,verificationStatus:row.verification_status,visibility:row.visibility};
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}


export async function upsertServiceMeetingPoint(pool:Pool,input:{userId:string;partnerId:string;serviceId:string;location:PartnerLocationInput}):Promise<PartnerLocationRow&{serviceId:string}>{
 validate(input.location);
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  await assertPartnerMember(client,input.userId,input.partnerId);
  const ownership=await client.query<{allowed:boolean}>("SELECT EXISTS(SELECT 1 FROM services WHERE id=$1 AND partner_id=$2) AS allowed",[input.serviceId,input.partnerId]);
  if(!ownership.rows[0]?.allowed)throw new LocationAccessDeniedError();
  const id=randomUUID(),visibility=input.location.visibility??"BOOKING_ONLY";
  const result=await client.query<{
   id:string;partner_id:string;service_id:string;name:string;area:string;latitude:string;longitude:string;accuracy_meters:number|null;verification_status:string;visibility:GeoVisibility;
  }>(`
   INSERT INTO geo_locations(id,kind,partner_id,service_id,name,area,latitude,longitude,accuracy_meters,source,verification_status,visibility)
   VALUES($1,'SERVICE_MEETING_POINT',$2,$3,$4,$5,$6,$7,$8,'PARTNER_PIN','PENDING',$9)
   ON CONFLICT(service_id) WHERE kind='SERVICE_MEETING_POINT' DO UPDATE SET
    partner_id=EXCLUDED.partner_id,name=EXCLUDED.name,area=EXCLUDED.area,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
    accuracy_meters=EXCLUDED.accuracy_meters,source='PARTNER_PIN',verification_status='PENDING',
    visibility=EXCLUDED.visibility,verified_by_user_id=NULL,verified_at=NULL,updated_at=now()
   RETURNING id,partner_id,service_id,name,area,latitude,longitude,accuracy_meters,verification_status,visibility
  `,[id,input.partnerId,input.serviceId,input.location.name.trim(),input.location.area.trim(),input.location.latitude,input.location.longitude,input.location.accuracyMeters??null,visibility]);
  const row=result.rows[0];
  await client.query("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'SERVICE_MEETING_POINT_SUBMITTED','geo_location',$3,$4::jsonb)",[randomUUID(),input.userId,row.id,JSON.stringify({partnerId:input.partnerId,serviceId:input.serviceId,verificationStatus:"PENDING"})]);
  await client.query("COMMIT");
  return {id:row.id,partnerId:row.partner_id,serviceId:row.service_id,name:row.name,area:row.area,latitude:Number(row.latitude),longitude:Number(row.longitude),accuracyMeters:row.accuracy_meters,verificationStatus:row.verification_status,visibility:row.visibility};
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
