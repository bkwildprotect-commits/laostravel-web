export const FREE_BOOKING_LIMIT=5 as const;
export type TrialStatus="RESERVED"|"CONSUMED"|"RELEASED";
export type TrialEntry={bookingId:string;ordinal:number|null;status:TrialStatus};
export type CommissionEligibility=
 |{kind:"TRIAL_FREE";ordinal:number}
 |{kind:"COMMISSIONABLE"};

export function decideCommissionEligibility(entries:TrialEntry[]):CommissionEligibility{
 const occupied=new Set(entries.filter(e=>e.status==="RESERVED"||e.status==="CONSUMED").map(e=>e.ordinal).filter((n):n is number=>n!==null&&n>=1&&n<=FREE_BOOKING_LIMIT));
 for(let ordinal=1;ordinal<=FREE_BOOKING_LIMIT;ordinal++)if(!occupied.has(ordinal))return {kind:"TRIAL_FREE",ordinal};
 return {kind:"COMMISSIONABLE"};
}

export function nextTrialStatus(current:TrialStatus,event:"QUALIFIED"|"CANCELLED"):TrialStatus{
 if(current==="CONSUMED")return current;
 if(event==="QUALIFIED")return "CONSUMED";
 return "RELEASED";
}
