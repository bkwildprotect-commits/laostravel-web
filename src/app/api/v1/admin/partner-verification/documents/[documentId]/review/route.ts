import {NextResponse} from "next/server";
import {AuthenticationError} from "@/lib/auth/authentication";
import {AdminAuthorizationError,requireAdminRole} from "@/lib/auth/admin-role";
import {getRuntimeAuthenticationAdapter} from "@/lib/auth/runtime";
import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";
import {PartnerVerificationDocumentConflictError,PartnerVerificationDocumentNotFoundError,reviewPartnerVerificationDocument,type PartnerDocumentDecision} from "@/lib/partner/postgres-verification-review";

export async function POST(request:Request,{params}:{params:Promise<{documentId:string}>}){
 const pool=getPostgresPool();let reviewer;
 try{reviewer=await requireAdminRole(request,{auth:getRuntimeAuthenticationAdapter(),pool,allowedRoles:["ADMIN"]})}
 catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:"Authentication is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401});
  if(error instanceof AdminAuthorizationError)return NextResponse.json({data:null,error:{code:"ADMIN_ACCESS_DENIED",message:"Administrative verification access is required."}},{status:403});
  return NextResponse.json({data:null,error:{code:"AUTHORIZATION_ERROR",message:"Authorization failed."}},{status:500});
 }
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({data:null,error:{code:"INVALID_JSON",message:"Request body must be valid JSON"}},{status:400})}
 const {documentId}=await params;const value=body&&typeof body==="object"?body as Record<string,unknown>:{};
 const decision=value.decision;
 if(!documentId||(decision!=="APPROVED"&&decision!=="REJECTED"))return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Document id and a valid decision are required."}},{status:400});
 try{
  await reviewPartnerVerificationDocument(pool,{reviewerUserId:reviewer.userId,documentId,decision:decision as PartnerDocumentDecision});
  return NextResponse.json({data:{documentId,decision},error:null},{status:200});
 }catch(error){
  if(error instanceof PartnerVerificationDocumentNotFoundError)return NextResponse.json({data:null,error:{code:"VERIFICATION_DOCUMENT_NOT_FOUND",message:"Verification document was not found."}},{status:404});
  if(error instanceof PartnerVerificationDocumentConflictError)return NextResponse.json({data:null,error:{code:"VERIFICATION_DOCUMENT_REVIEW_CONFLICT",message:"Document has already been reviewed. Reload before deciding."}},{status:409});
  console.error("Partner verification document review failed",error);return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Verification document could not be reviewed."}},{status:500});
 }
}
