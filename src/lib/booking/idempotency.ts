export type IdempotencyRecord={key:string;scope:string;requestHash:string;responseCode:number;responseBody:string;createdAt:string;expiresAt:string};
export function normalizeIdempotencyKey(value:string){const key=value.trim();if(key.length<8||key.length>128)throw new Error("INVALID_IDEMPOTENCY_KEY");return key}
export function assertIdempotentReplay(existing:IdempotencyRecord|undefined,requestHash:string){
 if(!existing)return "NEW" as const;
 if(existing.requestHash!==requestHash)throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
 return "REPLAY" as const;
}
