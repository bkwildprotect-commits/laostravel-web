export type AvailabilityInventory={remaining:number|null};
export function assertReservableInventory(inventory:AvailabilityInventory,quantity:number){
 if(!Number.isSafeInteger(quantity)||quantity<1)throw new Error("INVALID_QUANTITY");
 if(inventory.remaining===null)return;
 if(!Number.isSafeInteger(inventory.remaining)||inventory.remaining<0)throw new Error("INVALID_INVENTORY");
 if(inventory.remaining<quantity)throw new Error("INSUFFICIENT_INVENTORY");
}
export function remainingAfterReservation(inventory:AvailabilityInventory,quantity:number):number|null{
 assertReservableInventory(inventory,quantity);return inventory.remaining===null?null:inventory.remaining-quantity;
}
