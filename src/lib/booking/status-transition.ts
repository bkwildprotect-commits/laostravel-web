export type BookingStatus="PENDING"|"CONFIRMED"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";

const allowed:Record<BookingStatus,readonly BookingStatus[]>={
 PENDING:["CONFIRMED","CANCELLED","EXPIRED"],
 CONFIRMED:["COMPLETED","CANCELLED","NO_SHOW"],
 COMPLETED:[],CANCELLED:[],EXPIRED:[],NO_SHOW:[]
};

export class InvalidBookingStatusTransitionError extends Error{
 constructor(public from:BookingStatus,public to:BookingStatus){super("INVALID_BOOKING_STATUS_TRANSITION")}
}

export function assertBookingStatusTransition(from:BookingStatus,to:BookingStatus):void{
 if(!allowed[from].includes(to))throw new InvalidBookingStatusTransitionError(from,to);
}
