import type {TransactionContext} from "../infrastructure/transaction";
import type {BookingStatus} from "../booking/lifecycle";
import {commissionActionForBooking,type CommissionLedgerStatus} from "./ledger-lifecycle";
// Caller must hold the booking lock first, then the ledger lock. No money transfer.
export async function reconcileCommission(tx:TransactionContext,input:{bookingId:string;status:BookingStatus;payment:string;actorUserId?:string}){
 const rows=await tx.query<{status:CommissionLedgerStatus;commercial_terms_version:string|null}>("SELECT status,commercial_terms_version FROM partner_commission_ledger WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const ledger=rows[0];if(!ledger)return "NONE";
 let to:CommissionLedgerStatus=ledger.status;
 const action=commissionActionForBooking(input.status,ledger.status,input.payment,Boolean(ledger.commercial_terms_version?.trim()));
 if(action==="EARN")to="EARNED";
 else if(action==="VOID"||input.payment==="REFUNDED"&&ledger.status==="PENDING")to="VOID";
 else if(input.payment!=="PAID"&&ledger.status==="SETTLED")to="REVERSED";
 else if(input.payment==="REFUNDED"&&ledger.status==="EARNED")to="REVERSED";
 else if(input.payment!=="PAID"&&ledger.status==="EARNED")to="PENDING";
 if(to===ledger.status)return "NONE";
 const r=await tx.execute("UPDATE partner_commission_ledger SET status=$2,earned_at=CASE WHEN $2='EARNED' THEN now() ELSE earned_at END WHERE booking_id=$1 AND status=$3",[input.bookingId,to,ledger.status]);
 if(r.rowCount!==1)throw new Error("COMMISSION_LEDGER_STATE_CHANGED");
 await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'COMMISSION_STATUS_CHANGED','booking',$2,$3::jsonb)",[input.actorUserId??null,input.bookingId,JSON.stringify({fromStatus:ledger.status,toStatus:to,paymentStatus:input.payment,bookingStatus:input.status,termsVersion:ledger.commercial_terms_version})]);
 return to;
}
