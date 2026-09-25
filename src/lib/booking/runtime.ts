import {createHash} from "node:crypto";import type {CreateBookingRequest} from "@/lib/api/contracts";import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";import {PostgresTransactionAdapter} from "@/lib/infrastructure/postgres-transaction";import {PostgresBookingRepository} from "./postgres-repository";import {createBookingAtomically} from "./orchestrator";
export function stableBookingRequestHash(request:CreateBookingRequest){return createHash("sha256").update(JSON.stringify(request)).digest("hex")}
export async function executeBooking(input:{userId:string;request:CreateBookingRequest}){
 const pool=getPostgresPool();return createBookingAtomically(new PostgresTransactionAdapter(pool),new PostgresBookingRepository(),{userId:input.userId,idempotencyKey:input.request.idempotencyKey,requestHash:stableBookingRequestHash(input.request),bookingRequest:input.request});
}
