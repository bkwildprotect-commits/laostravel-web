import type {TransactionContext} from "../infrastructure/transaction";
import {transitionBooking,trialActionForTransition,type BookingEvent,type BookingStatus} from "./lifecycle";
import type {TrialStatus} from "../commission/trial";
import {commissionActionForBooking,type CommissionLedgerStatus} from "../commission/ledger-lifecycle";
import {inventoryHoldActionForBooking,type InventoryHoldStatus} from "./inventory-hold-lifecycle";

export class BookingLifecycleMutationError extends Error{
 constructor(public code:"BOOKING_NOT_FOUND"|"TRIAL_LEDGER_STATE_CHANGED"|"COMMISSION_LEDGER_STATE_CHANGED"|"INVENTORY_HOLD_STATE_CHANGED"){super(code)}
}

export async function mutateBookingLifecycle(tx:TransactionContext,input:{bookingId:string;event:BookingEvent}):Promise<{status:BookingStatus}>{
 const bookings=await tx.query<{status:BookingStatus}>("SELECT status FROM bookings WHERE id=$1 FOR UPDATE",[input.bookingId]);
 const booking=bookings[0];if(!booking)throw new BookingLifecycleMutationError("BOOKING_NOT_FOUND");
 const next=transitionBooking(booking.status,input.event);
 const trials=await tx.query<{status:TrialStatus}>("SELECT status FROM partner_trial_ledger WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const trial=trials[0];const action=trialActionForTransition(trial?.status,next);
 const holds=await tx.query<{status:InventoryHoldStatus}>("SELECT status FROM inventory_holds WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const holdActions=holds.map(hold=>inventoryHoldActionForBooking({bookingFrom:booking.status,bookingTo:next,hold:hold.status}));
 const holdAction=holdActions.find(action=>action!=="NONE")??"NONE";
 const expectedHoldMutations=holdActions.filter(action=>action===holdAction).length;
 const commissions=await tx.query<{status:CommissionLedgerStatus}>("SELECT status FROM partner_commission_ledger WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const commission=commissions[0];const commissionAction=commission?commissionActionForBooking(next,commission.status):"NONE";
 await tx.execute("UPDATE bookings SET status=$2 WHERE id=$1",[input.bookingId,next]);
 if(action==="CONSUME"){
  const r=await tx.execute("UPDATE partner_trial_ledger SET status='CONSUMED',consumed_at=NOW(),released_at=NULL WHERE booking_id=$1 AND status='RESERVED'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("TRIAL_LEDGER_STATE_CHANGED");
 }else if(action==="RELEASE"){
  const r=await tx.execute("UPDATE partner_trial_ledger SET status='RELEASED',released_at=NOW(),consumed_at=NULL WHERE booking_id=$1 AND status='RESERVED'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("TRIAL_LEDGER_STATE_CHANGED");
 }
 if(holdAction!=="NONE"){
  const target=holdAction==="CONSUME"?"CONSUMED":holdAction==="RELEASE"?"RELEASED":"EXPIRED";
  const r=await tx.execute("UPDATE inventory_holds SET status=$2 WHERE booking_id=$1 AND status=\'ACTIVE\'",[input.bookingId,target]);
  if(r.rowCount!==expectedHoldMutations)throw new BookingLifecycleMutationError("INVENTORY_HOLD_STATE_CHANGED");
 }
 if(commissionAction==="EARN"){
  const r=await tx.execute("UPDATE partner_commission_ledger SET status=\'EARNED\',earned_at=NOW() WHERE booking_id=$1 AND status=\'PENDING\'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("COMMISSION_LEDGER_STATE_CHANGED");
 }else if(commissionAction==="VOID"){
  const r=await tx.execute("UPDATE partner_commission_ledger SET status=\'VOID\' WHERE booking_id=$1 AND status=\'PENDING\'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("COMMISSION_LEDGER_STATE_CHANGED");
 }
 return {status:next};
}
