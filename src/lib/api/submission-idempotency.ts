export type SubmissionRecord={key:string;requestHash:string;status:"PROCESSING"|"COMPLETED";expiresAt:number};
export type SubmissionDecision="PROCESS"|"REPLAY"|"IN_PROGRESS";
export function normalizeSubmissionKey(value:string|null){const k=(value||"").trim();if(k.length<16||k.length>128||!/^[A-Za-z0-9._:-]+$/.test(k))throw new Error("INVALID_SUBMISSION_KEY");return k}
export function decideSubmission(existing:SubmissionRecord|undefined,input:{key:string;requestHash:string;now:number}):SubmissionDecision{
 if(!existing||existing.expiresAt<=input.now)return "PROCESS";
 if(existing.key!==input.key)throw new Error("SUBMISSION_KEY_MISMATCH");
 if(existing.requestHash!==input.requestHash)throw new Error("SUBMISSION_KEY_REUSED_WITH_DIFFERENT_REQUEST");
 return existing.status==="COMPLETED"?"REPLAY":"IN_PROGRESS";
}
