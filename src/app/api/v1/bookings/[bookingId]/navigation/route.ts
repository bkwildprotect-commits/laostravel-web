import {NextResponse} from "next/server";
import {AuthenticationError} from "../../../../../../lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "../../../../../../lib/auth/runtime";
import {getPostgresPool} from "../../../../../../lib/infrastructure/postgres-runtime";
import {BookingLocationAccessDeniedError,getBookingNavigation} from "../../../../../../lib/location/postgres-booking-navigation";

export async function GET(request:Request,{params}:{params:Promise<{bookingId:string}>}){
 let user;
 try{user=await getRuntimeAuthenticationAdapter().authenticate(request)}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  return NextResponse.json({data:null,error:{code:"AUTHENTICATION_ERROR",message:"Authentication verification failed."}},{status:500});
 }
 try{
  const {bookingId}=await params;if(!bookingId)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Booking id is required."}},{status:400});
  const data=await getBookingNavigation(getPostgresPool(),{userId:user.userId,bookingId});
  return NextResponse.json({data,error:null},{status:200});
 }catch(error){
  if(error instanceof BookingLocationAccessDeniedError)return NextResponse.json({data:null,error:{code:"NAVIGATION_NOT_AVAILABLE",message:"Verified navigation is not available for this booking."}},{status:404});
  console.error("Booking navigation read failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Navigation could not be loaded."}},{status:500});
 }
}
