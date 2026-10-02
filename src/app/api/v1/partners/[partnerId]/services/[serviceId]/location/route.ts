import {NextResponse} from "next/server";
import {AuthenticationError} from "@/lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "@/lib/auth/runtime";
import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";
import {LocationAccessDeniedError,LocationValidationError,upsertServiceMeetingPoint} from "@/lib/location/postgres-partner-location";

export async function PUT(request:Request,{params}:{params:Promise<{partnerId:string;serviceId:string}>}){
 let user;
 try{user=await getRuntimeAuthenticationAdapter().authenticate(request)}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  return NextResponse.json({data:null,error:{code:"AUTHENTICATION_ERROR",message:"Authentication verification failed."}},{status:500});
 }
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 try{
  const {partnerId,serviceId}=await params;
  if(!partnerId||!serviceId||!body||typeof body!=="object")throw new LocationValidationError("Partner, service, and location are required");
  const v=body as Record<string,unknown>;
  const data=await upsertServiceMeetingPoint(getPostgresPool(),{userId:user.userId,partnerId,serviceId,location:{
   name:typeof v.name==="string"?v.name:"",
   area:typeof v.area==="string"?v.area:"",
   latitude:typeof v.latitude==="number"?v.latitude:Number.NaN,
   longitude:typeof v.longitude==="number"?v.longitude:Number.NaN,
   accuracyMeters:v.accuracyMeters===null?null:typeof v.accuracyMeters==="number"?v.accuracyMeters:undefined,
   visibility:typeof v.visibility==="string"?v.visibility as "PUBLIC"|"BOOKING_ONLY"|"PRIVATE":undefined
  }});
  return NextResponse.json({data,error:null},{status:200});
 }catch(error){
  if(error instanceof LocationAccessDeniedError)return NextResponse.json({data:null,error:{code:"PARTNER_ACCESS_DENIED",message:"You do not have access to this partner or service."}},{status:403});
  if(error instanceof LocationValidationError)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:error.message}},{status:400});
  console.error("Service meeting point update failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Service meeting point could not be updated."}},{status:500});
 }
}
