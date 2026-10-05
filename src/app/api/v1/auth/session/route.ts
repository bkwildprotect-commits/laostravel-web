import {NextResponse} from "next/server";
import {AuthenticationError} from "../../../../../lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "../../../../../lib/auth/runtime";
import {getPostgresPool} from "../../../../../lib/infrastructure/postgres-runtime";
import {readMobileSession} from "../../../../../lib/auth/mobile-session";

export async function GET(request:Request){
 const headers={"Cache-Control":"no-store","Vary":"Authorization"};
 try{
  const user=await getRuntimeAuthenticationAdapter().authenticate(request);
  return NextResponse.json({data:await readMobileSession(getPostgresPool(),user.userId),error:null},{headers});
 }catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:"A verified active account is required."}},{status:error.code==="AUTH_NOT_CONFIGURED"?503:401,headers});
  console.error("Session profile failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Account could not be loaded."}},{status:500,headers});
 }
}
