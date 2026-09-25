import {NextResponse} from "next/server";import {validateTourLead} from "@/lib/api/tour-lead-validation";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Invalid request body"}},{status:400})}
 const result=validateTourLead(body);if(!result.ok)return NextResponse.json({data:null,error:{code:result.code,message:"Invalid booking enquiry"}},{status:400});
 // Fail closed until an approved persistent storage provider and retention policy are configured.
 return NextResponse.json({data:null,error:{code:"LEAD_STORAGE_NOT_CONFIGURED",message:"Booking enquiry storage is not configured yet"}},{status:503});
}
