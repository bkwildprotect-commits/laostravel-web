import {NextResponse} from "next/server";
import {EmergencyDirectoryInputError,getNearbyVerifiedEmergencyEntries} from "@/lib/emergency/postgres-emergency-directory";
import {getPostgresPool,PostgresRuntimeConfigurationError} from "@/lib/infrastructure/postgres-runtime";

export async function GET(request:Request){
  const url=new URL(request.url);
  const latitude=Number(url.searchParams.get("lat"));
  const longitude=Number(url.searchParams.get("lng"));
  const radiusRaw=url.searchParams.get("radiusMeters");
  const radiusMeters=radiusRaw===null?undefined:Number(radiusRaw);
  try{
    const entries=await getNearbyVerifiedEmergencyEntries(getPostgresPool(),{latitude,longitude,radiusMeters});
    return NextResponse.json({data:{entries},error:null},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    if(error instanceof EmergencyDirectoryInputError)
      return NextResponse.json({data:null,error:{code:error.code,message:"Valid location parameters are required."}},{status:400});
    if(error instanceof PostgresRuntimeConfigurationError)
      return NextResponse.json({data:null,error:{code:"SERVICE_NOT_CONFIGURED",message:"Emergency directory is not configured."}},{status:503});
    return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Emergency directory could not be loaded."}},{status:500});
  }
}
