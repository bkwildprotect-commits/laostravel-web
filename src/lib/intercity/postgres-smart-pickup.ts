import type {Pool} from "pg";

export class SmartPickupError extends Error{
 constructor(public code:"INVALID_INPUT"|"BOOKING_NOT_ELIGIBLE"|"PICKUP_NOT_FOUND"|"ACCESS_DENIED"|"PICKUP_ALREADY_DECIDED"){super(code)}
}
function validCoordinate(lat:number,lng:number){return Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lng)&&lng>=-180&&lng<=180}

export async function createSmartPickupRequest(pool:Pool,input:{userId:string;bookingId:string;latitude:number;longitude:number;label?:string}){
 if(!input.bookingId||!validCoordinate(input.latitude,input.longitude)||input.label&&input.label.trim().length>160)throw new SmartPickupError("INVALID_INPUT");
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const eligible=await client.query<{smart_pickup_max_detour_m:number}>(`
   SELECT sc.smart_pickup_max_detour_m
   FROM bookings b
   JOIN booking_items bi ON bi.booking_id=b.id
   JOIN services s ON s.id=bi.service_id
   JOIN service_capability_details sc ON sc.service_id=s.id
   WHERE b.id=$1 AND b.user_id=$2 AND b.status IN ('REQUESTED','CONFIRMED')
     AND s.service_kind='INTERCITY_TRANSPORT' AND sc.vehicle_type='VIP_VAN'
     AND sc.smart_pickup_enabled=true AND sc.pickup_requires_operator_approval=true
   LIMIT 1 FOR SHARE OF b
  `,[input.bookingId,input.userId]);
  if(!eligible.rows[0])throw new SmartPickupError("BOOKING_NOT_ELIGIBLE");
  const created=await client.query<{id:string;operator_status:string}>(`
   INSERT INTO intercity_pickup_requests(booking_id,pickup_latitude,pickup_longitude,pickup_label)
   VALUES($1,$2,$3,$4) RETURNING id,operator_status
  `,[input.bookingId,input.latitude,input.longitude,input.label?.trim()||null]);
  await client.query("COMMIT");
  return {requestId:created.rows[0].id,status:created.rows[0].operator_status,maxDetourMeters:eligible.rows[0].smart_pickup_max_detour_m};
 }catch(error){await client.query("ROLLBACK");if((error as {code?:string}).code==="23505")throw new SmartPickupError("BOOKING_NOT_ELIGIBLE");throw error}finally{client.release()}
}

export async function decideSmartPickupRequest(pool:Pool,input:{userId:string;partnerId:string;requestId:string;decision:"ACCEPTED"|"DECLINED";routeDetourMeters?:number;routeDetourSeconds?:number}){
 if(!input.partnerId||!input.requestId||!["ACCEPTED","DECLINED"].includes(input.decision))throw new SmartPickupError("INVALID_INPUT");
 if(input.decision==="DECLINED"&&(input.routeDetourMeters!==undefined||input.routeDetourSeconds!==undefined))throw new SmartPickupError("INVALID_INPUT");
 if(input.routeDetourMeters!==undefined&&(!Number.isSafeInteger(input.routeDetourMeters)||input.routeDetourMeters<0))throw new SmartPickupError("INVALID_INPUT");
 if(input.routeDetourSeconds!==undefined&&(!Number.isSafeInteger(input.routeDetourSeconds)||input.routeDetourSeconds<0))throw new SmartPickupError("INVALID_INPUT");
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const access=await client.query<{allowed:boolean}>(`SELECT EXISTS(
    SELECT 1 FROM intercity_pickup_requests r
    JOIN partner_booking_commercial_paths pc ON pc.booking_id=r.booking_id
    JOIN partner_members pm ON pm.partner_id=pc.partner_id
    WHERE r.id=$1 AND pc.partner_id=$2 AND pm.user_id=$3
  ) allowed`,[input.requestId,input.partnerId,input.userId]);
  if(!access.rows[0]?.allowed)throw new SmartPickupError("ACCESS_DENIED");
  const result=await client.query<{booking_id:string}>(`
   UPDATE intercity_pickup_requests
   SET operator_status=$1,decided_at=now(),route_detour_m=$2,route_detour_seconds=$3
   WHERE id=$4 AND operator_status='PENDING' RETURNING booking_id
  `,[input.decision,input.routeDetourMeters??null,input.routeDetourSeconds??null,input.requestId]);
  if(!result.rows[0])throw new SmartPickupError("PICKUP_ALREADY_DECIDED");
  await client.query("COMMIT");return {requestId:input.requestId,status:input.decision};
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
