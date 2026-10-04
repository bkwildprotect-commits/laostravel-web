import type {TransactionContext} from "../infrastructure/transaction";
import {transitionBooking,trialActionForTransition,type BookingEvent,type BookingStatus} from "./lifecycle";
import type {TrialStatus} from "../commission/trial";
import {commissionActionForBooking,type CommissionLedgerStatus} from "../commission/ledger-lifecycle";
import {inventoryHoldActionForBooking,type InventoryHoldStatus} from "./inventory-hold-lifecycle";

export class BookingLifecycleMutationError extends Error{
 constructor(public code:"BOOKING_NOT_FOUND"|"TRIAL_LEDGER_STATE_CHANGED"|"COMMISSION_LEDGER_STATE_CHANGED"|"INVENTORY_HOLD_STATE_CHANGED"|"MEETING_POINT_NOT_VERIFIED"){super(code)}
}

export async function mutateBookingLifecycle(tx:TransactionContext,input:{bookingId:string;event:BookingEvent;actorUserId?:string}):Promise<{status:BookingStatus}>{
 const bookings=await tx.query<{status:BookingStatus}>("SELECT status FROM bookings WHERE id=$1 FOR UPDATE",[input.bookingId]);
 const booking=bookings[0];if(!booking)throw new BookingLifecycleMutationError("BOOKING_NOT_FOUND");
 const next=transitionBooking(booking.status,input.event);
 const trials=await tx.query<{status:TrialStatus}>("SELECT status FROM partner_trial_ledger WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const trial=trials[0];const action=trialActionForTransition(trial?.status,next);
 const holds=await tx.query<{status:InventoryHoldStatus}>("SELECT status FROM inventory_holds WHERE booking_id=$1 FOR UPDATE",[input.bookingId]);
 const holdActions=holds.map(hold=>inventoryHoldActionForBooking({bookingFrom:booking.status,bookingTo:next,hold:hold.status}));
 const holdAction=holdActions.find(action=>action!=="NONE")??"NONE";
 const expectedHoldMutations=holdActions.filter(action=>action===holdAction).length;
 if(booking.status==="REQUESTED"&&next==="CONFIRMED"){
  const meetingPoints=await tx.query<{booking_item_id:string;verification_status:string}>("SELECT bi.id AS booking_item_id,g.verification_status FROM booking_items bi JOIN geo_locations g ON g.service_id=bi.service_id AND g.kind='SERVICE_MEETING_POINT' WHERE bi.booking_id=$1 FOR SHARE OF g",[input.bookingId]);
  if(meetingPoints.some(point=>point.verification_status!=="VERIFIED"))throw new BookingLifecycleMutationError("MEETING_POINT_NOT_VERIFIED");
  await tx.execute("INSERT INTO booking_location_snapshots(booking_item_id,booking_id,service_id,source_location_id,name,area,latitude,longitude) SELECT bi.id,bi.booking_id,bi.service_id,g.id,g.name,g.area,g.latitude,g.longitude FROM booking_items bi JOIN geo_locations g ON g.service_id=bi.service_id AND g.kind='SERVICE_MEETING_POINT' AND g.verification_status='VERIFIED' WHERE bi.booking_id=$1 ON CONFLICT(booking_item_id) DO NOTHING",[input.bookingId]);
 }
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
 await tx.execute(
  "INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES(gen_random_uuid(),$1,'BOOKING_STATUS_CHANGED','booking',$2,jsonb_build_object('fromStatus',$3,'toStatus',$4,'event',$5,'trialAction',$6,'inventoryHoldAction',$7,'commissionAction',$8))",
  [input.actorUserId??null,input.bookingId,booking.status,next,input.event,action,holdAction,commissionAction]
 );
 return {status:next};
}
