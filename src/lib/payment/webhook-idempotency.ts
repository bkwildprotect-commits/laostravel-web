export type WebhookEventRecord={provider:string;eventId:string;payloadHash:string;status:"PROCESSING"|"COMPLETED"|"FAILED"};
export type WebhookDecision="PROCESS"|"REPLAY"|"IN_PROGRESS";
export function decideWebhook(existing:WebhookEventRecord|undefined,input:{provider:string;eventId:string;payloadHash:string}):WebhookDecision{
 if(!input.provider.trim()||!input.eventId.trim()||!input.payloadHash.trim())throw new Error("INVALID_WEBHOOK_IDENTITY");
 if(!existing)return "PROCESS";
 if(existing.provider!==input.provider||existing.eventId!==input.eventId)throw new Error("WEBHOOK_IDENTITY_MISMATCH");
 if(existing.payloadHash!==input.payloadHash)throw new Error("WEBHOOK_PAYLOAD_CONFLICT");
 if(existing.status==="COMPLETED")return "REPLAY";
 if(existing.status==="PROCESSING")return "IN_PROGRESS";
 return "PROCESS";
}
