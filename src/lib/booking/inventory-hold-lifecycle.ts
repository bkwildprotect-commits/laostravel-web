import type {BookingStatus} from "./lifecycle";
export type InventoryHoldStatus="ACTIVE"|"CONSUMED"|"RELEASED"|"EXPIRED";export type InventoryHoldAction="NONE"|"CONSUME"|"RELEASE"|"EXPIRE";
export function inventoryHoldActionForBooking(input:{bookingFrom:BookingStatus;bookingTo:BookingStatus;hold:InventoryHoldStatus}):InventoryHoldAction{
 if(input.hold==="CONSUMED"&&input.bookingFrom==="CONFIRMED"&&input.bookingTo==="CANCELLED")return "RELEASE";
 if(input.hold!=="ACTIVE")return "NONE";if(input.bookingFrom==="REQUESTED"&&input.bookingTo==="CONFIRMED")return "CONSUME";if(input.bookingFrom==="REQUESTED"&&input.bookingTo==="CANCELLED")return "RELEASE";if(input.bookingFrom==="REQUESTED"&&input.bookingTo==="EXPIRED")return "EXPIRE";return "NONE";
}
