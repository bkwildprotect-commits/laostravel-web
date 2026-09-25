export type CommissionLedgerStatus="PENDING"|"EARNED"|"VOID"|"SETTLED"|"REVERSED";
export type CommissionAction="NONE"|"EARN"|"VOID";
export function commissionActionForBooking(status:"PENDING"|"CONFIRMED"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW",ledger:CommissionLedgerStatus):CommissionAction{
 if(status==="COMPLETED"&&ledger==="PENDING")return "EARN";
 if((status==="CANCELLED"||status==="EXPIRED")&&ledger==="PENDING")return "VOID";
 return "NONE";
}
