import {describe,expect,it,vi} from "vitest";
import {mutateBookingLifecycle} from "./postgres-lifecycle";

describe("postgres booking lifecycle mutation",()=>{
 it("completes booking and consumes its reserved trial in one transaction context",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"b1",event:"COMPLETE"});
  expect(result).toEqual({status:"COMPLETED"});
  expect(execute.mock.calls[0]).toEqual(["UPDATE bookings SET status=$2 WHERE id=$1",["b1","COMPLETED"]]);
  expect(execute.mock.calls[1][0]).toContain("status='CONSUMED'");
 });
 it("releases reserved trial on no-show",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"b2",event:"MARK_NO_SHOW"});
  expect(result).toEqual({status:"NO_SHOW"});
  expect(execute.mock.calls[1][0]).toContain("status='RELEASED'");
 });
 it("fails closed if the reserved trial changed concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as any,{bookingId:"b3",event:"COMPLETE"})).rejects.toMatchObject({code:"TRIAL_LEDGER_STATE_CHANGED"});
 });
 it("earns pending commission when a confirmed commissionable booking completes",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"c1",event:"COMPLETE"});
  expect(result).toEqual({status:"COMPLETED"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("status='EARNED'"))).toBe(true);
 });
 it("voids pending commission when a pending booking is cancelled",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"PENDING"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  await mutateBookingLifecycle({query,execute} as any,{bookingId:"c2",event:"CANCEL"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("status='VOID'"))).toBe(true);
 });
 it("does not automatically mutate commission on no-show",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  await mutateBookingLifecycle({query,execute} as any,{bookingId:"c3",event:"MARK_NO_SHOW"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("commission_ledger"))).toBe(false);
 });

 it("voids pending commission when a pending booking expires",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"PENDING"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"c4",event:"EXPIRE"});
  expect(result).toEqual({status:"EXPIRED"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("status='VOID'"))).toBe(true);
 });
 it("fails closed if pending commission changes concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as any,{bookingId:"c5",event:"COMPLETE"})).rejects.toMatchObject({code:"COMMISSION_LEDGER_STATE_CHANGED"});
 });

});
