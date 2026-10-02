import type {BookingStatus} from "./lifecycle";
const allowed:Record<BookingStatus,readonly BookingStatus[]>={
 REQUESTED:["CONFIRMED","CANCELLED","EXPIRED"],CONFIRMED:["CHECKED_IN","CANCELLED","NO_SHOW"],CHECKED_IN:["IN_SERVICE","COMPLETED","CANCELLED"],IN_SERVICE:["COMPLETED"],COMPLETED:[],CANCELLED:[],EXPIRED:[],NO_SHOW:[]
};
export type {BookingStatus};
export class InvalidBookingStatusTransitionError extends Error{constructor(public from:BookingStatus,public to:BookingStatus){super("INVALID_BOOKING_STATUS_TRANSITION")}}
export function assertBookingStatusTransition(from:BookingStatus,to:BookingStatus):void{if(!allowed[from].includes(to))throw new InvalidBookingStatusTransitionError(from,to)}
