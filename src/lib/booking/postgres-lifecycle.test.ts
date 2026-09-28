import {describe,expect,it,vi} from "vitest";
import {mutateBookingLifecycle} from "./postgres-lifecycle";

describe("postgres booking lifecycle mutation",()=>{
 it("completes booking and consumes its reserved trial in one transaction context",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"b1",event:"COMPLETE"});
  expect(result).toEqual({status:"COMPLETED"});
  expect(execute.mock.calls[0]).toEqual(["UPDATE bookings SET status=$2 WHERE id=$1",["b1","COMPLETED"]]);
  expect(execute.mock.calls[1][0]).toContain("status='CONSUMED'");
 });
 it("releases reserved trial on no-show",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]);
  const execute=vi.fn().mockResolvedValue({rowCount:1});
  const result=await mutateBookingLifecycle({query,execute} as any,{bookingId:"b2",event:"MARK_NO_SHOW"});
  expect(result).toEqual({status:"NO_SHOW"});
  expect(execute.mock.calls[1][0]).toContain("status='RELEASED'");
 });
 it("fails closed if the reserved trial changed concurrently",async()=>{
  const query=vi.fn().mockResolvedValueOnce([{status:"CONFIRMED"}]).mockResolvedValueOnce([{status:"RESERVED"}]);
  const execute=vi.fn().mockResolvedValueOnce({rowCount:1}).mockResolvedValueOnce({rowCount:0});
  await expect(mutateBookingLifecycle({query,execute} as any,{bookingId:"b3",event:"COMPLETE"})).rejects.toMatchObject({code:"TRIAL_LEDGER_STATE_CHANGED"});
 });
});
