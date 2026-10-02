import {describe,expect,it,vi} from "vitest";
import type {TransactionContext} from "../infrastructure/transaction";
import {mutateBookingLifecycle} from "./postgres-lifecycle";

describe("postgres booking lifecycle mutation",()=>{
 it("completes booking and consumes its reserved trial in one transaction context",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"IN_SERVICE"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"b1",event:"COMPLETE"});
  expect(result).toEqual({status:"COMPLETED"});
  expect(execute.mock.calls[0]).toEqual(["UPDATE bookings SET status=$2 WHERE id=$1",["b1","COMPLETED"]]);
  expect(execute.mock.calls[1][0]).toContain("status='CONSUMED'");
 });
 it("releases reserved trial on no-show",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"b2",event:"MARK_NO_SHOW"});
  expect(result).toEqual({status:"NO_SHOW"});
  expect(execute.mock.calls[1][0]).toContain("status='RELEASED'");
 });
 it("fails closed if the reserved trial changed concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"IN_SERVICE"}]).mockResolvedValueOnce([{status:"RESERVED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"b3",event:"COMPLETE"})).rejects.toMatchObject({code:"TRIAL_LEDGER_STATE_CHANGED"});
 });
 it("earns requested commission when a confirmed commissionable booking completes",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"IN_SERVICE"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"c1",event:"COMPLETE"});
  expect(result).toEqual({status:"COMPLETED"});
  expect(String(query.mock.calls[3][0])).toContain("FROM partner_commission_ledger");
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("UPDATE partner_commission_ledger")&&String(sql).includes("status='EARNED'"))).toBe(true);
 });
 it("voids requested commission when a requested booking is cancelled",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"REQUESTED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"c2",event:"CANCEL"});
  const mutation=String(execute.mock.calls.find(([sql])=>String(sql).includes("UPDATE partner_commission_ledger"))?.[0]);
  expect(mutation).toContain("status='VOID'");
  expect(mutation).not.toContain("voided_at");
 });
 it("does not automatically mutate commission on no-show",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"c3",event:"MARK_NO_SHOW"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("commission_ledger"))).toBe(false);
 });

 it("voids requested commission when a requested booking expires",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"REQUESTED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"c4",event:"EXPIRE"});
  expect(result).toEqual({status:"EXPIRED"});
  expect(execute.mock.calls.some(([sql])=>String(sql).includes("status='VOID'"))).toBe(true);
 });
 it("fails closed if requested commission changes concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"IN_SERVICE"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"PENDING"}]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"c5",event:"COMPLETE"})).rejects.toMatchObject({code:"COMMISSION_LEDGER_STATE_CHANGED"});
 });

 it("consumes an active inventory hold when a requested booking is confirmed",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"REQUESTED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"ACTIVE"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"i1",event:"CONFIRM"});
  expect(result).toEqual({status:"CONFIRMED"});
  expect(execute.mock.calls.some(([sql,args])=>String(sql).includes("UPDATE inventory_holds")&&args?.[1]==="CONSUMED")).toBe(true);
 });
 it("consumes every active inventory hold for a multi-item booking",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"REQUESTED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"ACTIVE"},{status:"ACTIVE"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:2});
  const result=await mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"i-multi",event:"CONFIRM"});
  expect(result).toEqual({status:"CONFIRMED"});
  expect(execute.mock.calls[1][1]).toEqual(["i-multi","CONSUMED"]);
 });
 it("fails closed if an active inventory hold changes concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"REQUESTED"}]).mockResolvedValueOnce([]).mockResolvedValueOnce([{status:"ACTIVE"}]).mockResolvedValueOnce([]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as unknown as TransactionContext,{bookingId:"i2",event:"CONFIRM"})).rejects.toMatchObject({code:"INVENTORY_HOLD_STATE_CHANGED"});
 });

});
