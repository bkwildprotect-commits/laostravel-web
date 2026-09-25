import type {BookingStatus} from "./lifecycle";
import type {HoldStatus} from "./inventory-hold";
export type InventoryAction="NONE"|"CONSUME"|"RELEASE"|"EXPIRE";
export function inventoryActionForBookingTransition(currentHold:HoldStatus|undefined,nextBooking:BookingStatus):InventoryAction{
 if(!currentHold||currentHold!=="ACTIVE")return "NONE";
 if(nextBooking==="CONFIRMED")return "CONSUME";
 if(nextBooking==="CANCELLED")return "RELEASE";
 if(nextBooking==="EXPIRED")return "EXPIRE";
 return "NONE";
}
export function inventoryActionForPaymentFailure(currentHold:HoldStatus|undefined):InventoryAction{
 return currentHold==="ACTIVE"?"RELEASE":"NONE";
}
