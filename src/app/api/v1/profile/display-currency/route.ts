import {NextResponse} from "next/server";
import {AuthenticationError} from "../../../../../lib/auth/authentication";
import {getRuntimeAuthenticationAdapter} from "../../../../../lib/auth/runtime";
import {getPostgresPool} from "../../../../../lib/infrastructure/postgres-runtime";
import {DisplayCurrencyPreferenceError,updateDisplayCurrencyPreference} from "../../../../../lib/profile/postgres-display-currency";

const headers={"Cache-Control":"no-store","Vary":"Authorization"};
export async function POST(request:Request){
 try{
  const actor=await getRuntimeAuthenticationAdapter().authenticate(request);
  let body:unknown;
  try{body=await request.json()}catch{throw new DisplayCurrencyPreferenceError("INVALID_DISPLAY_CURRENCY")}
  const value=body&&typeof body==="object"&&!Array.isArray(body)
   ? (body as Record<string,unknown>).preferredDisplayCurrency:undefined;
  return NextResponse.json({data:await updateDisplayCurrencyPreference(getPostgresPool(),actor.userId,value),error:null},{headers});
 }catch(error){
  if(error instanceof AuthenticationError)return NextResponse.json({data:null,error:{code:error.code,message:"A verified active account is required."}},
   {status:error.code==="AUTH_NOT_CONFIGURED"?503:401,headers});
  if(error instanceof DisplayCurrencyPreferenceError)return NextResponse.json({data:null,error:{code:error.code,message:"Choose a supported display currency."}},
   {status:400,headers});
  console.error("Display currency preference update failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Display currency preference could not be updated."}},{status:500,headers});
 }
}
