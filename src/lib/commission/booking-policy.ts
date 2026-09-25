import type {BookingStatus} from "@/lib/booking/lifecycle";
import type {CommissionLedgerStatus} from "./ledger-lifecycle";
import type {TrialStatus} from "./trial";
export type RevenueAction={trial:"NONE"|"CONSUME"|"RELEASE";commission:"NONE"|"EARN"|"VOID"};
export function revenueActionForBooking(input:{bookingStatus:BookingStatus;trialStatus?:TrialStatus;commissionStatus?:CommissionLedgerStatus}):RevenueAction{
 const out:RevenueAction={trial:"NONE",commission:"NONE"};
 if(input.trialStatus){
  if(input.commissionStatus)throw new Error("TRIAL_AND_COMMISSION_MUTUALLY_EXCLUSIVE");
  if(input.trialStatus==="RESERVED"&&input.bookingStatus==="COMPLETED")out.trial="CONSUME";
  else if(input.trialStatus==="RESERVED"&&["CANCELLED","EXPIRED","NO_SHOW"].includes(input.bookingStatus))out.trial="RELEASE";
  return out;
 }
 if(input.commissionStatus==="PENDING"){
  if(input.bookingStatus==="COMPLETED")out.commission="EARN";
  else if(input.bookingStatus==="CANCELLED"||input.bookingStatus==="EXPIRED")out.commission="VOID";
  // NO_SHOW commission policy is intentionally unresolved: no automatic mutation.
 }
 return out;
}
