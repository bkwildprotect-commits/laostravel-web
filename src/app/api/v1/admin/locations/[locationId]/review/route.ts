import {NextResponse} from "next/server";
import {AuthenticationError} from "@/lib/auth/authentication";
import {AdminAuthorizationError,requireAdminRole} from "@/lib/auth/admin-role";
import {getRuntimeAuthenticationAdapter} from "@/lib/auth/runtime";
import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";
import {LocationReviewConflictError,LocationReviewNotFoundError,reviewLocationAtomically,type ReviewDecision} from "@/lib/location/postgres-location-review";

export async function POST(request:Request,{params}:{params:Promise<{locationId:string}>}){
 const pool=getPostgresPool();let reviewer;
 try{reviewer=await requireAdminRole(request,{auth:getRuntimeAuthenticationAdapter(),pool,allowedRoles:["ADMIN","LOCATION_REVIEWER"]})}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  if(error instanceof AdminAuthorizationError)return NextResponse.json({data:null,error:{code:"ADMIN_ACCESS_DENIED",message:"Administrative review access is required."}},{status:403});
  return NextResponse.json({data:null,error:{code:"AUTHORIZATION_ERROR",message:"Authorization failed."}},{status:500});
 }
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const {locationId}=await params;const v=body&&typeof body==="object"?body as Record<string,unknown>:{};
 const decision=v.decision,expectedUpdatedAt=v.expectedUpdatedAt;
 if(!locationId||(decision!=="VERIFIED"&&decision!=="REJECTED")||typeof expectedUpdatedAt!=="string"||!expectedUpdatedAt)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Location id, decision, and expectedUpdatedAt are required."}},{status:400});
 try{
  await reviewLocationAtomically(pool,{reviewerUserId:reviewer.userId,locationId,decision:decision as ReviewDecision,expectedUpdatedAt});
  return NextResponse.json({data:{locationId,decision},error:null},{status:200});
 }catch(error){
  if(error instanceof LocationReviewNotFoundError)return NextResponse.json({data:null,error:{code:"LOCATION_NOT_FOUND",message:"Location was not found."}},{status:404});
  if(error instanceof LocationReviewConflictError)return NextResponse.json({data:null,error:{code:"LOCATION_REVIEW_CONFLICT",message:"Location changed or was already reviewed. Reload before deciding."}},{status:409});
  console.error("GPS location review failed",error);return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Location review could not be completed."}},{status:500});
 }
}
