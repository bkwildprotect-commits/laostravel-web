export type HoldStatus="ACTIVE"|"CONSUMED"|"RELEASED"|"EXPIRED";
export type InventoryHold={id:string;serviceId:string;availabilityId:string;quantity:number;status:HoldStatus;expiresAt:string;bookingId?:string};
export function canConsumeHold(hold:InventoryHold,now=new Date()):boolean{return hold.status==="ACTIVE"&&hold.quantity>0&&new Date(hold.expiresAt).getTime()>now.getTime()}
export function shouldReleaseHold(status:"CANCELLED"|"EXPIRED"|"FAILED_PAYMENT"|"QUOTE_EXPIRED"):boolean{return ["CANCELLED","EXPIRED","FAILED_PAYMENT","QUOTE_EXPIRED"].includes(status)}
