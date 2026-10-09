import {describe,expect,it,vi} from "vitest";import {settleCommissionEntry} from "./postgres-settlement";
function pool(payment="PAID",terms:string|null="T1",status="EARNED"){
 const q=vi.fn(async(sql:string)=>({rows:sql.includes('FROM bookings')?[{status:"COMPLETED",payment_status:payment}]:sql.includes('SELECT booking_id')?[{booking_id:"b"}]:sql.includes('FROM partner_commission_ledger')?[{status,partner_id:"p",booking_id:"b",commercial_terms_version:terms}]:[],rowCount:1}));return {q,p:{connect:async()=>({query:q,release:vi.fn()})}};
}
describe("commission settlement",()=>{
 it("settles qualified earned commission once with audit",async()=>{const {p,q}=pool();await expect(settleCommissionEntry(p as never,{ledgerId:"l",actorUserId:"u",settlementReference:"ref"})).resolves.toEqual({status:"SETTLED"});expect(q.mock.calls.some(([sql])=>sql.includes('audit_logs'))).toBe(true)});
 it.each(["UNPAID","REFUNDED","DISPUTED"])("blocks settlement on %s",async payment=>{await expect(settleCommissionEntry(pool(payment).p as never,{ledgerId:"l",actorUserId:"u",settlementReference:"ref"})).rejects.toMatchObject({code:"COMMISSION_NOT_ELIGIBLE"})});
 it("blocks missing historical acceptance evidence",async()=>{await expect(settleCommissionEntry(pool("PAID",null).p as never,{ledgerId:"l",actorUserId:"u",settlementReference:"ref"})).rejects.toMatchObject({code:"COMMISSION_NOT_ELIGIBLE"})});
 it("blocks repeated settlement",async()=>{await expect(settleCommissionEntry(pool("PAID","T1","SETTLED").p as never,{ledgerId:"l",actorUserId:"u",settlementReference:"ref"})).rejects.toMatchObject({code:"COMMISSION_NOT_EARNED"})});
});
