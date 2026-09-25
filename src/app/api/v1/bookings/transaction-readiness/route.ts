import {NextResponse} from "next/server";import {backendReady} from "@/lib/api/server-state";
export async function GET(){
 const backend=backendReady();
 return NextResponse.json({data:{ready:false,configurationReady:backend.ready,missing:backend.missing,requirements:["postgres_transaction_adapter","authenticated_user_context","quote_revalidation","inventory_lock","trial_lock","commission_rule_repository","audit_writer"]},error:null},{status:200});
}
