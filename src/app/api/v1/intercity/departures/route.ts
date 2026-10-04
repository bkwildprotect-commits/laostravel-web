import {NextResponse} from "next/server";
import {getPostgresPool,PostgresRuntimeConfigurationError} from "@/lib/infrastructure/postgres-runtime";
import {IntercityCatalogInputError,listPublicIntercityDepartures,validateIntercityCatalogQuery} from "@/lib/intercity/public-catalog";

export async function GET(request:Request){
 const url=new URL(request.url);
 try{
  const query=validateIntercityCatalogQuery({
   date:url.searchParams.get("date"),
   originAreaCode:url.searchParams.get("originAreaCode"),
   destinationAreaCode:url.searchParams.get("destinationAreaCode"),
   vehicleType:url.searchParams.get("vehicleType"),
   locale:url.searchParams.get("locale"),
   limit:url.searchParams.get("limit"),
  });
  const departures=await listPublicIntercityDepartures(getPostgresPool(),query);
  return NextResponse.json({data:{departures},error:null},{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=30"}});
 }catch(error){
  if(error instanceof IntercityCatalogInputError)
   return NextResponse.json({data:null,error:{code:error.code,message:"Valid intercity search parameters are required."}},{status:400});
  if(error instanceof PostgresRuntimeConfigurationError)
   return NextResponse.json({data:null,error:{code:"SERVICE_NOT_CONFIGURED",message:"Intercity catalog is not configured."}},{status:503});
  console.error("Intercity catalog failed",error);
  return NextResponse.json({data:null,error:{code:"INTERNAL_ERROR",message:"Intercity departures could not be loaded."}},{status:500});
 }
}
