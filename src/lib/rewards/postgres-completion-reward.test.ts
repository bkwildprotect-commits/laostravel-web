import {describe,it,expect,vi} from "vitest";
import {grantCompletionReward} from "./postgres-completion-reward";
describe("completion reward",()=>{
 it("grants once from a completed owned booking",async()=>{
  const tx={query:vi.fn().mockResolvedValue([{ok:true}]),execute:vi.fn().mockResolvedValue({rowCount:1})};
  await expect(grantCompletionReward(tx as never,{bookingId:"b",userId:"u",points:10})).resolves.toEqual({granted:true});
 });
 it("treats a concurrent duplicate insert as an idempotent replay",async()=>{
  const tx={query:vi.fn().mockResolvedValue([{ok:true}]),execute:vi.fn().mockResolvedValue({rowCount:0})};
  await expect(grantCompletionReward(tx as never,{bookingId:"b",userId:"u",points:10})).resolves.toEqual({granted:false,reason:"ALREADY_GRANTED"});
  expect(tx.execute.mock.calls[0][0]).toContain("ON CONFLICT");
 });
 it("rejects a booking belonging to another user before writing",async()=>{
  const tx={query:vi.fn().mockResolvedValue([{ok:false}]),execute:vi.fn()};
  await expect(grantCompletionReward(tx as never,{bookingId:"b",userId:"u",points:10})).rejects.toMatchObject({code:"BOOKING_NOT_ELIGIBLE"});
  expect(tx.execute).not.toHaveBeenCalled();
 });
});
