import {NextResponse} from "next/server";
import {AuthenticationError} from "../../../../../../lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "../../../../../../lib/auth/runtime";
import {getPostgresPool} from "../../../../../../lib/infrastructure/postgres-runtime";
import {listPartnerBookings} from "../../../../../../lib/partner/postgres-booking-read";

export async function GET(request:Request,{params}:{params:Promise<{partnerId:string}>}){
 let user;
 try{user=await getRuntimeAuthenticationAdapter().authenticate(request)}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  return NextResponse.json({data:null,error:{code:"AUTHENTICATION_ERROR",message:"Authentication verification failed."}},{status:500});
 }
 try{
  const {partnerId}=await params;
  if(!partnerId)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Partner id is required."}},{status:400});
  const url=new URL(request.url);const raw=url.searchParams.get("limit");const limit=raw===null?undefined:Number(raw);
  if(limit!==undefined&&(!Number.isSafeInteger(limit)||limit<1))return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Limit must be a positive integer."}},{status:400});
  const rows=await listPartnerBookings(getPostgresPool() as any,{userId:user.userId,partnerId,limit});
  return NextResponse.json({data:rows,error:null},{status:200});
 }catch(error){
  console.error("Partner booking read failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Partner bookings could not be loaded."}},{status:500});
 }
}
