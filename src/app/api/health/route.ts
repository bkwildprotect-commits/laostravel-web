import { NextResponse } from "next/server";import { infrastructureHealth } from "@/lib/infrastructure";
export const dynamic="force-dynamic";
export async function GET(){const adapters=await infrastructureHealth();const configured=adapters.every(a=>a.status==="ready");return NextResponse.json({service:"laostravel-web",status:configured?"configured":"setup_required",adapters},{status:configured?200:503})}
