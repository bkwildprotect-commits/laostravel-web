import {NextResponse} from "next/server";
import {getProductionReadiness} from "@/lib/infrastructure/production-readiness";

export const dynamic="force-dynamic";

export async function GET(){
 return NextResponse.json(
  {data:getProductionReadiness(),error:null},
  {status:200,headers:{"Cache-Control":"no-store"}},
 );
}
