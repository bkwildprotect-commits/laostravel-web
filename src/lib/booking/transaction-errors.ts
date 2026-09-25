export type BookingErrorCode=
|"AUTH_REQUIRED"|"IDEMPOTENCY_CONFLICT"|"REQUEST_IN_PROGRESS"|"QUOTE_INVALID"|"QUOTE_EXPIRED"
|"INVENTORY_UNAVAILABLE"|"SERVICE_NOT_BOOKABLE"|"BACKEND_NOT_CONFIGURED"|"INTERNAL_ERROR";
export class BookingTransactionError extends Error{
 constructor(public readonly code:BookingErrorCode,message:string,public readonly httpStatus:number){super(message);this.name="BookingTransactionError"}
}
