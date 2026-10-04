import {NextResponse} from "next/server";import {getProductionReadiness} from "@/lib/infrastructure/production-readiness";
export async function GET(){const state=getProductionReadiness();return NextResponse.json({data:state,error:null},{status:200})}
