import {NextResponse} from "next/server";
import {AuthenticationError} from "../../../../../../../../lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "../../../../../../../../lib/auth/runtime";
import {getPostgresPool} from "../../../../../../../../lib/infrastructure/postgres-runtime";
import {mutatePartnerBookingLifecycle,PartnerBookingMutationAccessDeniedError} from "../../../../../../../../lib/partner/postgres-booking-lifecycle";
import {BookingLifecycleMutationError} from "../../../../../../../../lib/booking/postgres-lifecycle";
import type {BookingEvent} from "../../../../../../../../lib/booking/lifecycle";

const events=new Set<BookingEvent>(["CONFIRM","CHECK_IN","START_SERVICE","COMPLETE","CANCEL","EXPIRE","MARK_NO_SHOW"]);

export async function PATCH(request:Request,{params}:{params:Promise<{partnerId:string;bookingId:string}>}){
 let user;
 try{user=await getRuntimeAuthenticationAdapter().authenticate(request)}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  return NextResponse.json({data:null,error:{code:"AUTHENTICATION_ERROR",message:"Authentication verification failed."}},{status:500});
 }
 try{
  const {partnerId,bookingId}=await params;
  const body=await request.json().catch(()=>null) as {event?:unknown}|null;
  if(!partnerId||!bookingId||!body||typeof body.event!=="string"||!events.has(body.event as BookingEvent))
   return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"A valid booking lifecycle event is required."}},{status:400});
  const result=await mutatePartnerBookingLifecycle(getPostgresPool(),{userId:user.userId,partnerId,bookingId,event:body.event as BookingEvent});
  return NextResponse.json({data:result,error:null},{status:200});
 }catch(error){
  if(error instanceof PartnerBookingMutationAccessDeniedError)return NextResponse.json({data:null,error:{code:"PARTNER_BOOKING_MUTATION_ACCESS_DENIED",message:"Partner booking access is not permitted."}},{status:403});
  if(error instanceof BookingLifecycleMutationError&&error.code==="BOOKING_NOT_FOUND")return NextResponse.json({data:null,error:{code:error.code,message:"Booking was not found."}},{status:404});
  if(error instanceof BookingLifecycleMutationError)return NextResponse.json({data:null,error:{code:error.code,message:"Booking status could not be updated safely."}},{status:409});
  if(error instanceof Error&&error.message.startsWith("Invalid booking transition:"))return NextResponse.json({data:null,error:{code:"INVALID_BOOKING_TRANSITION",message:"This booking status change is not allowed."}},{status:409});
  console.error("Partner booking lifecycle mutation failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Booking status could not be updated."}},{status:500});
 }
}
