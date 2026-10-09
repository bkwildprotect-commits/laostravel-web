import type {Pool} from "pg";
import {PostgresTransactionAdapter} from "../infrastructure/postgres-transaction";
export class SettlementTransitionError extends Error{constructor(public code:"COMMISSION_ENTRY_NOT_FOUND"|"COMMISSION_NOT_EARNED"|"COMMISSION_NOT_ELIGIBLE"){super(code)}}
export async function settleCommissionEntry(pool:Pool,input:{ledgerId:string;actorUserId:string;settlementReference:string}){
 return new PostgresTransactionAdapter(pool).run("SERIALIZABLE",async tx=>{
  const refs=await tx.query<{booking_id:string}>("SELECT booking_id FROM partner_commission_ledger WHERE id=$1",[input.ledgerId]);if(!refs[0])throw new SettlementTransitionError("COMMISSION_ENTRY_NOT_FOUND");
  const bookings=await tx.query<{status:string;payment_status:string}>("SELECT status,payment_status FROM bookings WHERE id=$1 FOR UPDATE",[refs[0].booking_id]);
  const rows=await tx.query<{status:string;partner_id:string;booking_id:string;commercial_terms_version:string|null}>("SELECT status,partner_id,booking_id,commercial_terms_version FROM partner_commission_ledger WHERE id=$1 FOR UPDATE",[input.ledgerId]);const row=rows[0];
  if(!row)throw new SettlementTransitionError("COMMISSION_ENTRY_NOT_FOUND");
  if(row.status!=="EARNED")throw new SettlementTransitionError("COMMISSION_NOT_EARNED");
  if(bookings[0]?.status!=="COMPLETED"||bookings[0]?.payment_status!=="PAID"||!row.commercial_terms_version?.trim())throw new SettlementTransitionError("COMMISSION_NOT_ELIGIBLE");
  await tx.execute("UPDATE partner_commission_ledger SET status='SETTLED',settled_at=now() WHERE id=$1 AND status='EARNED'",[input.ledgerId]);
  await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'COMMISSION_SETTLED','partner_commission_ledger',$2,$3::jsonb)",[input.actorUserId,input.ledgerId,JSON.stringify({partnerId:row.partner_id,bookingId:row.booking_id,settlementReference:input.settlementReference})]);
  return {status:"SETTLED" as const};
 });
}
