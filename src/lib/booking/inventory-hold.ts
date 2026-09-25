export type HoldStatus="ACTIVE"|"CONSUMED"|"RELEASED"|"EXPIRED";
export type InventoryHold={id:string;serviceId:string;availabilityId:string;quantity:number;status:HoldStatus;expiresAt:string;bookingId?:string};
export type HoldEvent="CONSUME"|"RELEASE"|"TIMEOUT";
export function canConsumeHold(hold:InventoryHold,now=new Date()):boolean{return hold.status==="ACTIVE"&&hold.quantity>0&&new Date(hold.expiresAt).getTime()>now.getTime()}
export function transitionHold(hold:InventoryHold,event:HoldEvent,now=new Date()):HoldStatus{
 if(hold.status!=="ACTIVE")throw new Error("HOLD_ALREADY_FINALIZED");
 const expires=new Date(hold.expiresAt).getTime();
 if(Number.isNaN(expires))throw new Error("INVALID_HOLD_EXPIRY");
 if(event==="TIMEOUT")return "EXPIRED";
 if(expires<=now.getTime())throw new Error("HOLD_EXPIRED");
 return event==="CONSUME"?"CONSUMED":"RELEASED";
}
export function shouldReleaseHold(status:"CANCELLED"|"EXPIRED"|"FAILED_PAYMENT"|"QUOTE_EXPIRED"):boolean{return ["CANCELLED","EXPIRED","FAILED_PAYMENT","QUOTE_EXPIRED"].includes(status)}
