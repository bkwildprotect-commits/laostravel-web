import {NextResponse} from "next/server";import {validateAvailabilityQuote} from "@/lib/api/quote-validation";import {backendReady} from "@/lib/api/server-state";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const checked=validateAvailabilityQuote(body);if(!checked.ok)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Invalid availability request",details:checked.errors}},{status:400});
 const backend=backendReady();if(!backend.ready)return NextResponse.json({data:null,error:{code:"BACKEND_NOT_CONFIGURED",message:"Availability and pricing are unavailable until the server database/auth adapters are connected."}},{status:503});
 // Never manufacture availability, inventory tokens, prices or discounts on the client/server stub.
 return NextResponse.json({data:null,error:{code:"QUOTE_ENGINE_NOT_CONNECTED",message:"Server configuration exists, but the transactional availability and pricing engine is not connected yet."}},{status:503});
}
