import {NextResponse} from "next/server";import {validateCreateBooking} from "@/lib/api/validation";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const checked=validateCreateBooking(body);if(!checked.ok)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Invalid booking request",details:checked.errors}},{status:400});
 return NextResponse.json({data:null,error:{code:"BACKEND_NOT_CONFIGURED",message:"Booking creation is unavailable until server-side availability, pricing, authentication and database adapters are connected."}},{status:503});
}
