export function mapMutationError(error:unknown):{code:string;message:string;status:number}|null{
 if(!(error instanceof Error))return null;
 const code=(error as {code?:string}).code??error.message;
 const statuses:Record<string,number>={TRANSACTION_RETRY_EXHAUSTED:503,SERVICE_AREA_NOT_BOOKABLE:409,PARTNER_COMMERCIAL_TERMS_REQUIRED:409,PARTNER_NO_BOOKABLE_SERVICE:409,PARTNER_COMMERCIAL_TERMS_ALREADY_EXIST:409,PARTNER_NOT_ELIGIBLE_FOR_ACTIVATION:409,COMMISSION_RULE_NOT_CONFIGURED:503,PRICE_QUOTE_ALREADY_CONSUMED:409,BOOKING_TARGET_NOT_FOUND:404,AVAILABILITY_NOT_FOUND:404,COMMISSION_LEDGER_STATE_CHANGED:409};
 if(code==="22P02")return {code:"VALIDATION_ERROR",message:"A valid identifier is required.",status:400};
 if(code==="23505")return {code:"RESOURCE_CONFLICT",message:"This operation conflicts with an existing record.",status:409};
 const status=statuses[code];return status?{code,message:status===503?"The operation is temporarily unavailable. Retry the same request and idempotency key.":"The operation is not eligible in its current state.",status}:null;
}
