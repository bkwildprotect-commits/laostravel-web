import {NextResponse} from "next/server";import {validateTourLead} from "@/lib/api/tour-lead-validation";import {normalizeSubmissionKey} from "@/lib/api/submission-idempotency";
export async function POST(request:Request){
 let submissionKey:string;try{submissionKey=normalizeSubmissionKey(request.headers.get("idempotency-key"))}catch{return NextResponse.json({data:null,error:{code:"INVALID_IDEMPOTENCY_KEY",message:"A valid idempotency key is required"}},{status:400})}
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Invalid request body"}},{status:400})}
 const result=validateTourLead(body);if(!result.ok)return NextResponse.json({data:null,error:{code:result.code,message:"Invalid booking enquiry"}},{status:400});
 // Validate the request contract now, but do not claim persistence or idempotent storage before an approved durable provider exists.
 void submissionKey;
 return NextResponse.json({data:null,error:{code:"LEAD_STORAGE_NOT_CONFIGURED",message:"Booking enquiry storage is not configured yet"}},{status:503});
}
