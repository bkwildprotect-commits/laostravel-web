import {describe,it,expect} from "vitest";import {PostgresTourLeadRepository} from "../postgres-tour-lead-repository";

const lead={id:"00000000-0000-4000-8000-000000000001",submissionKey:"submission-key-0001",requestHash:"hash-a",name:"Test User",phone:"+8562012345678",email:"test@example.com",requestedDate:"2026-10-20",guests:2,consent:true as const};
describe("PostgresTourLeadRepository",()=>{
 it("returns CREATED when insert wins",async()=>{const db={query:async<T=unknown>()=>({rows:[{id:lead.id}] as T[],rowCount:1})};await expect(new PostgresTourLeadRepository(db).insertOrResolve(lead)).resolves.toEqual({kind:"CREATED",id:lead.id})});
 it("returns REPLAY for the same submission payload",async()=>{let n=0;const db={query:async<T=unknown>()=>++n===1?({rows:[] as T[],rowCount:0}):({rows:[{id:lead.id,request_hash:"hash-a"}] as T[],rowCount:1})};await expect(new PostgresTourLeadRepository(db).insertOrResolve(lead)).resolves.toEqual({kind:"REPLAY",id:lead.id})});
 it("returns CONFLICT when the key is reused with changed payload",async()=>{let n=0;const db={query:async<T=unknown>()=>++n===1?({rows:[] as T[],rowCount:0}):({rows:[{id:lead.id,request_hash:"hash-b"}] as T[],rowCount:1})};await expect(new PostgresTourLeadRepository(db).insertOrResolve(lead)).resolves.toEqual({kind:"CONFLICT"})});
});
