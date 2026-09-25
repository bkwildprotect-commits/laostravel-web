export type IdempotencyRecord={key:string;userId:string;requestHash:string;status:"PROCESSING"|"COMPLETED"|"FAILED";expiresAt:string};
export function normalizeIdempotencyKey(value:string){const key=value.trim();if(key.length<8||key.length>128)throw new Error("INVALID_IDEMPOTENCY_KEY");return key}
export function decideIdempotency(existing:IdempotencyRecord|undefined,userId:string,requestHash:string){
 if(!existing)return "CREATE" as const;if(existing.userId!==userId||existing.requestHash!==requestHash)return "CONFLICT" as const;
 return existing.status==="COMPLETED"?"REPLAY" as const:"IN_PROGRESS" as const;
}
export function assertIdempotentReplay(existing:IdempotencyRecord|undefined,requestHash:string){if(!existing)return "NEW" as const;if(existing.requestHash!==requestHash)throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");return "REPLAY" as const}
