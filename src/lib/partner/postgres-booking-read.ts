import type {Pool} from "pg";

export class PartnerAccessDeniedError extends Error{constructor(){super("PARTNER_ACCESS_DENIED")}}

export type PartnerBookingRow={
 bookingId:string;bookingRef:string;status:string;paymentStatus:string;createdAt:string;
 serviceId:string;quantity:number;currency:string;customerTotal:string;commercialPath:"LAUNCH_FREE"|"COMMISSIONABLE";
};

export async function listPartnerBookings(pool:Pool,input:{userId:string;partnerId:string;limit?:number}):Promise<PartnerBookingRow[]>{
 const limit=Math.min(Math.max(input.limit??50,1),100);
 const membership=await pool.query<{allowed:boolean}>("SELECT EXISTS(SELECT 1 FROM partner_members WHERE partner_id=$1 AND user_id=$2) AS allowed",[input.partnerId,input.userId]);
 if(!membership.rows[0]?.allowed)throw new PartnerAccessDeniedError();
 const result=await pool.query<{
  booking_id:string;booking_ref:string;status:string;payment_status:string;created_at:Date;
  service_id:string;quantity:number;currency:string;customer_total:string;commercial_path:"LAUNCH_FREE"|"COMMISSIONABLE";
 }>(`
  SELECT b.id AS booking_id,b.booking_ref,b.status,b.payment_status,b.created_at,
         bi.service_id,bi.quantity,ps.currency,ps.customer_total,pc.path AS commercial_path
  FROM partner_members pm
  JOIN partner_booking_commercial_paths pc ON pc.partner_id=pm.partner_id
  JOIN bookings b ON b.id=pc.booking_id
  JOIN booking_items bi ON bi.booking_id=b.id
  JOIN services s ON s.id=bi.service_id AND s.partner_id=pm.partner_id
  JOIN price_snapshots ps ON ps.booking_id=b.id
  WHERE pm.partner_id=$1 AND pm.user_id=$2
  ORDER BY b.created_at DESC,b.id DESC
  LIMIT $3
 `,[input.partnerId,input.userId,limit]);
 return result.rows.map(r=>({bookingId:r.booking_id,bookingRef:r.booking_ref,status:r.status,paymentStatus:r.payment_status,createdAt:r.created_at.toISOString(),serviceId:r.service_id,quantity:r.quantity,currency:r.currency,customerTotal:r.customer_total,commercialPath:r.commercial_path}));
}
