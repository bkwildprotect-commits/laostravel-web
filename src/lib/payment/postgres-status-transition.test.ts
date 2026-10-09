import {describe,expect,it,vi} from "vitest";
import {transitionBookingPayment} from "./postgres-status-transition";
function pool(payment:string){const q=vi.fn(async(sql:string)=>sql.includes('FROM bookings')?{rows:[{status:"COMPLETED",payment_status:payment}]}:{rows:[],rowCount:1});return {q,p:{connect:async()=>({query:q,release:vi.fn()})}}}
describe("payment status transition",()=>{
 it("updates and audits a valid transition",async()=>{const {q,p}=pool("UNPAID");await expect(transitionBookingPayment(p as never,{bookingId:"b",actorUserId:"u",to:"PAID",reason:"direct payment"})).resolves.toEqual({status:"PAID"});expect(q.mock.calls.some(([sql])=>sql.includes('audit_logs'))).toBe(true)});
 it.each(["UNPAID","REFUNDED"])("rejects invalid transition from %s",async payment=>{const {p}=pool(payment);await expect(transitionBookingPayment(p as never,{bookingId:"b",actorUserId:"u",to:payment==="REFUNDED"?"DISPUTED":"REFUNDED",reason:"test"})).rejects.toMatchObject({code:"INVALID_PAYMENT_TRANSITION"})});
});
