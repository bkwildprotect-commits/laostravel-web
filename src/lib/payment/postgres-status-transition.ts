import type {Pool} from "pg";
import type {BookingStatus} from "../booking/lifecycle";
import {PostgresTransactionAdapter} from "../infrastructure/postgres-transaction";
import {reconcileCommission} from "../commission/postgres-qualification";
export type CanonicalPaymentStatus="UNPAID"|"PAID"|"REFUNDED"|"DISPUTED";
export class PaymentTransitionError extends Error{constructor(public code:"BOOKING_NOT_FOUND"|"INVALID_PAYMENT_TRANSITION"){super(code)}}
const allowed:Record<CanonicalPaymentStatus,readonly CanonicalPaymentStatus[]>={UNPAID:["PAID","DISPUTED"],PAID:["REFUNDED","DISPUTED"],REFUNDED:[],DISPUTED:["PAID","REFUNDED"]};
export async function transitionBookingPayment(pool:Pool,input:{bookingId:string;actorUserId:string;to:CanonicalPaymentStatus;reason:string}){
 return new PostgresTransactionAdapter(pool).run("SERIALIZABLE",async tx=>{
  const rows=await tx.query<{status:BookingStatus;payment_status:CanonicalPaymentStatus}>("SELECT status,payment_status FROM bookings WHERE id=$1 FOR UPDATE",[input.bookingId]);const row=rows[0];
  if(!row)throw new PaymentTransitionError("BOOKING_NOT_FOUND");
  if(!allowed[row.payment_status]?.includes(input.to))throw new PaymentTransitionError("INVALID_PAYMENT_TRANSITION");
  await tx.execute("UPDATE bookings SET payment_status=$2 WHERE id=$1",[input.bookingId,input.to]);
  await reconcileCommission(tx,{bookingId:input.bookingId,status:row.status,payment:input.to,actorUserId:input.actorUserId});
  await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'PAYMENT_STATUS_CHANGED','booking',$2,$3::jsonb)",[input.actorUserId,input.bookingId,JSON.stringify({fromStatus:row.payment_status,toStatus:input.to,reason:input.reason})]);
  return {status:input.to};
 });
}
