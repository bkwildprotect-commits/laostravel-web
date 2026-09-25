import {NextResponse} from "next/server";import {validateCreateBooking} from "../../../../lib/api/validation";import {getBookingApiReadiness} from "../../../../lib/booking/api-readiness";import {AuthenticationError} from "../../../../lib/auth/authentication";import {getRuntimeAuthenticationAdapter} from "../../../../lib/auth/runtime";import {executeBooking} from "../../../../lib/booking/runtime";import {BookingTransactionError} from "../../../../lib/booking/transaction-errors";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const checked=validateCreateBooking(body);if(!checked.ok)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Invalid booking request",details:checked.errors}},{status:400});
 const readiness=getBookingApiReadiness();if(!readiness.ready)return NextResponse.json({data:null,error:{code:"BOOKING_API_NOT_READY",message:"Booking creation is temporarily unavailable until production safety prerequisites are verified."}},{status:503});
 let user;try{user=await getRuntimeAuthenticationAdapter().authenticate(request)}catch(error){if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});return NextResponse.json({data:null,error:{code:"AUTHENTICATION_ERROR",message:"Authentication verification failed."}},{status:500})}
 try{
  const result=await executeBooking({userId:user.userId,request:checked.value});
  return NextResponse.json({data:result,error:null},{status:201});
 }catch(error){
  if(error instanceof BookingTransactionError)return NextResponse.json({data:null,error:{code:error.code,message:error.message}},{status:error.httpStatus});
  console.error("Booking execution failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Booking could not be created."}},{status:500});
 }
}
