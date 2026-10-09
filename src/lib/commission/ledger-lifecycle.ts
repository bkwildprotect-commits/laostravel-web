import type {BookingStatus} from "../booking/lifecycle";
export type CommissionLedgerStatus="PENDING"|"EARNED"|"VOID"|"SETTLED"|"REVERSED";
export type CommissionAction="NONE"|"EARN"|"VOID";
export function commissionActionForBooking(status:BookingStatus,ledger:CommissionLedgerStatus,payment="UNPAID",termsEligible=false):CommissionAction{
 if(status==="COMPLETED"&&payment==="PAID"&&termsEligible&&ledger==="PENDING")return "EARN";
 if((status==="CANCELLED"||status==="EXPIRED")&&ledger==="PENDING")return "VOID";
 return "NONE";
}
