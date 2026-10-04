export type BookingErrorCode=
|"AUTH_REQUIRED"|"IDEMPOTENCY_CONFLICT"|"REQUEST_IN_PROGRESS"|"QUOTE_INVALID"|"QUOTE_EXPIRED"
|"PRICE_QUOTE_MISMATCH"|"INVENTORY_UNAVAILABLE"|"SERVICE_NOT_BOOKABLE"|"BACKEND_NOT_CONFIGURED"
|"BOOKING_TARGET_NOT_FOUND"|"DESIGNATED_STOP_NOT_ALLOWED"|"INTERCITY_VEHICLE_NOT_CONFIGURED"
|"BUS_DESIGNATED_STOP_REQUIRED"|"BUS_DESIGNATED_STOP_INVALID"|"INTERNAL_ERROR";
export class BookingTransactionError extends Error{
 constructor(public readonly code:BookingErrorCode,message:string,public readonly httpStatus:number){super(message);this.name="BookingTransactionError"}
}
