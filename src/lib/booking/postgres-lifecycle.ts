import type {TransactionContext} from "../infrastructure/transaction";
import {transitionBooking,trialActionForTransition,type BookingEvent,type BookingStatus} from "./lifecycle";
import type {TrialStatus} from "../commission/trial";

export class BookingLifecycleMutationError extends Error{
 constructor(public code:"BOOKING_NOT_FOUND"|"TRIAL_LEDGER_STATE_CHANGED"){super(code)}
}

export async function mutateBookingLifecycle(tx:TransactionContext,input:{bookingId:string;event:BookingEvent}):Promise<{status:BookingStatus}>{
 const bookings=await tx.query<{status:BookingStatus}>("SELECT status FROM bookings WHERE id=$1 FOR UPDATE",[input.bookingId]);
 const booking=bookings[0];if(!booking)throw new BookingLifecycleMutationError("BOOKING_NOT_FOUND");
 const next=transitionBooking(booking.status,input.event);
 const trials=await tx.query<{status:TrialStatus}>("SELECT status FROM partner_trial_ledger WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const trial=trials[0];const action=trialActionForTransition(trial?.status,next);
 await tx.execute("UPDATE bookings SET status=$2 WHERE id=$1",[input.bookingId,next]);
 if(action==="CONSUME"){
  const r=await tx.execute("UPDATE partner_trial_ledger SET status='CONSUMED',consumed_at=NOW(),released_at=NULL WHERE booking_id=$1 AND status='RESERVED'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("TRIAL_LEDGER_STATE_CHANGED");
 }else if(action==="RELEASE"){
  const r=await tx.execute("UPDATE partner_trial_ledger SET status='RELEASED',released_at=NOW(),consumed_at=NULL WHERE booking_id=$1 AND status='RESERVED'",[input.bookingId]);
  if(r.rowCount!==1)throw new BookingLifecycleMutationError("TRIAL_LEDGER_STATE_CHANGED");
 }
 return {status:next};
}
