export type InventoryHoldStatus="ACTIVE"|"CONSUMED"|"RELEASED"|"EXPIRED";
export type InventoryHoldAction="NONE"|"CONSUME"|"RELEASE"|"EXPIRE";

/**
 * Only transitions with locked business semantics live here.
 * Post-confirmation cancellation restoration remains intentionally unresolved.
 */
export function inventoryHoldActionForBooking(input:{bookingFrom:"PENDING"|"CONFIRMED"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";bookingTo:"PENDING"|"CONFIRMED"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";hold:InventoryHoldStatus}):InventoryHoldAction{
 if(input.hold!=="ACTIVE")return "NONE";
 if(input.bookingFrom==="PENDING"&&input.bookingTo==="CONFIRMED")return "CONSUME";
 if(input.bookingFrom==="PENDING"&&input.bookingTo==="CANCELLED")return "RELEASE";
 if(input.bookingFrom==="PENDING"&&input.bookingTo==="EXPIRED")return "EXPIRE";
 return "NONE";
}
