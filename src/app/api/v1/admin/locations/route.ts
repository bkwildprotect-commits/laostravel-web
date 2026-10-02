import {NextResponse} from "next/server";
import {AuthenticationError} from "@/lib/auth/authentication";
import {AdminAuthorizationError,requireAdminRole} from "@/lib/auth/admin-role";
import {getRuntimeAuthenticationAdapter} from "@/lib/auth/runtime";
import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";
import {listPendingLocationReviews} from "@/lib/location/postgres-location-review";

export async function GET(request:Request){
 const pool=getPostgresPool();
 try{
  await requireAdminRole(request,{auth:getRuntimeAuthenticationAdapter(),pool,allowedRoles:["ADMIN","LOCATION_REVIEWER"]});
  const url=new URL(request.url),raw=url.searchParams.get("limit"),limit=raw===null?50:Number(raw);
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Limit must be an integer from 1 to 100."}},{status:400});
  return NextResponse.json({data:await listPendingLocationReviews(pool,limit),error:null},{status:200});
 }catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:error.code==="AUTH_NOT_CONFIGURED"?"Authentication verification is not connected.":"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  if(error instanceof AdminAuthorizationError)return NextResponse.json({data:null,error:{code:"ADMIN_ACCESS_DENIED",message:"Administrative review access is required."}},{status:403});
  console.error("GPS review queue failed",error);return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Location review queue could not be loaded."}},{status:500});
 }
}
