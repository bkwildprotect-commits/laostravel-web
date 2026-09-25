import {NextResponse} from "next/server";import {validateCreateBooking} from "@/lib/api/validation";import {getBookingApiReadiness} from "@/lib/booking/api-readiness";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const checked=validateCreateBooking(body);if(!checked.ok)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Invalid booking request",details:checked.errors}},{status:400});
 const readiness=getBookingApiReadiness();if(!readiness.ready)return NextResponse.json({data:null,error:{code:"BOOKING_API_NOT_READY",message:"Booking creation is temporarily unavailable until production safety prerequisites are verified."}},{status:503});
 // Deliberately closed: readiness approval must only be enabled together with authenticated user resolution,
 // authoritative availability/price-quote verification, concrete PostgreSQL pool wiring and passing integration CI.
 return NextResponse.json({data:null,error:{code:"BOOKING_EXECUTION_NOT_WIRED",message:"Booking execution adapter is not connected."}},{status:503});
}
