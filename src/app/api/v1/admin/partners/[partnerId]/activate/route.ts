import {NextResponse} from "next/server";
import {AuthenticationError} from "@/lib/auth/authentication";
import {AdminAuthorizationError,requireAdminRole} from "@/lib/auth/admin-role";
import {getRuntimeAuthenticationAdapter} from "@/lib/auth/runtime";
import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";
import {PostgresTransactionAdapter} from "@/lib/infrastructure/postgres-transaction";
import {activatePartnerCommercially,PartnerCommercialActivationError} from "@/lib/partner/postgres-commercial-activation";

export async function POST(request:Request,{params}:{params:Promise<{partnerId:string}>}){
 const pool=getPostgresPool();let actor;
 try{actor=await requireAdminRole(request,{auth:getRuntimeAuthenticationAdapter(),pool,allowedRoles:["ADMIN"]})}
 catch(e){
  if(e instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:e.code,message:"Authentication is required."}},{status:e.code==="AUTH_NOT_CONFIGURED"?503:401});
  if(e instanceof AdminAuthorizationError)return NextResponse.json({data:null,error:{code:"ADMIN_ACCESS_DENIED",message:"Administrative Partner activation access is required."}},{status:403});
  return NextResponse.json({data:null,error:{code:"AUTHORIZATION_ERROR",message:"Authorization failed."}},{status:500});
 }
 const {partnerId}=await params;
 try{
  const data=await new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>activatePartnerCommercially(tx,{partnerId,actorUserId:actor.userId}));
  return NextResponse.json({data,error:null});
 }catch(e){
  if(e instanceof PartnerCommercialActivationError){
   const status=e.code==="PARTNER_NOT_FOUND"?404:409;
   return NextResponse.json({data:null,error:{code:e.code,message:"Partner is not eligible for commercial activation."}},{status});
  }
  console.error("Partner commercial activation failed",e);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Partner could not be commercially activated."}},{status:500});
 }
}
