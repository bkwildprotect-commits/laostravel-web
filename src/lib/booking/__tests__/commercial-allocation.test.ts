import {describe,it,expect,vi} from "vitest";import {PostgresBookingRepository} from "../postgres-repository";
function tx(ordinals:number[],rules:{version:string}[]=[]){return {query:vi.fn().mockResolvedValueOnce(ordinals.map(trial_ordinal=>({trial_ordinal}))).mockResolvedValueOnce(rules),execute:vi.fn()}}
describe("PostgreSQL commercial allocation",()=>{
 it("allocates first free ordinal",async()=>{const r=new PostgresBookingRepository();await expect(r.allocateCommercialPath(tx([1,2,4]) as never,{partnerId:"p"})).resolves.toEqual({path:"TRIAL_FREE",ordinal:3})});
 it("allocates fifth slot when 1-4 occupied",async()=>{const r=new PostgresBookingRepository();await expect(r.allocateCommercialPath(tx([1,2,3,4]) as never,{partnerId:"p"})).resolves.toEqual({path:"TRIAL_FREE",ordinal:5})});
 it("fails closed after five occupied when no approved commission rule exists",async()=>{const r=new PostgresBookingRepository();await expect(r.allocateCommercialPath(tx([1,2,3,4,5]) as never,{partnerId:"p"})).resolves.toEqual({path:"COMMISSIONABLE",ruleVersion:"UNRESOLVED"})});
 it("snapshots the active approved rule version after the free trial",async()=>{const r=new PostgresBookingRepository();await expect(r.allocateCommercialPath(tx([1,2,3,4,5],[{version:"LAOS-2026-01"}]) as never,{partnerId:"p"})).resolves.toEqual({path:"COMMISSIONABLE",ruleVersion:"LAOS-2026-01"})});
});