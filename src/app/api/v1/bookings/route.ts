import {NextResponse} from "next/server";import {validateCreateBooking} from "@/lib/api/validation";import {getBookingApiReadiness} from "@/lib/booking/api-readiness";import {AuthenticationError,UnconfiguredAuthenticationAdapter} from "@/lib/auth/authentication";
const auth=new UnconfiguredAuthenticationAdapter();
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const checked=validateCreateBooking(body);if(!checked.ok)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Invalid booking request",details:checked.errors}},{status:400});
 const readiness=getBookingApiReadiness();if(!readiness.ready)return NextResponse.json({data:null,error:{code:"BOOKING_API_NOT_READY",message:"Booking creation is temporarily unavailable until production safety prerequisites are verified."}},{status:503});
 let user;try{user=await auth.authenticate(request)}catch(error){if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});throw error}
 // Security boundary: user.userId is server-resolved only. Booking JSON has no userId field.
 void user;
 return NextResponse.json({data:null,error:{code:"BOOKING_EXECUTION_NOT_WIRED",message:"Booking execution adapter is not connected."}},{status:503});
}
