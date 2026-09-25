export type InventoryState={capacity:number;remaining:number;version:number};
export type InventoryHold={id:string;serviceId:string;availabilityId:string;quantity:number;status:"ACTIVE"|"CONSUMED"|"RELEASED"|"EXPIRED";expiresAt:string;version:number};
export function canHoldInventory(state:InventoryState,quantity:number){
 return Number.isInteger(quantity)&&quantity>0&&quantity<=state.remaining&&state.remaining<=state.capacity;
}
export function remainingAfterHold(state:InventoryState,quantity:number){
 if(!canHoldInventory(state,quantity))throw new Error("INSUFFICIENT_INVENTORY");
 return {...state,remaining:state.remaining-quantity,version:state.version+1};
}
export function shouldReleaseHold(status:InventoryHold["status"]){return status==="RELEASED"||status==="EXPIRED"}
