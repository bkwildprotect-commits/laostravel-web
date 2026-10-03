import {describe,it,expect,vi} from "vitest";import {PostgresBookingRepository} from "../postgres-repository";
describe("commission snapshot persistence",()=>{
 it("persists the active rule rate and immutable amounts from authoritative base price",async()=>{
  const tx={query:vi.fn().mockResolvedValue([{rate_bps:250}]),execute:vi.fn().mockResolvedValue({rowCount:1})};
  const repo=new PostgresBookingRepository();
  await repo.persistCommercialPath(tx as never,{bookingId:"b6",partnerId:"p1",commercial:{path:"COMMISSIONABLE",ruleVersion:"R1"},price:{currency:"LAK",baseAmount:"100000",feesAmount:"0",couponAmount:"0",pointsBenefitAmount:"0",customerTotal:"100000",priceQuoteId:"q1"}});
  expect(tx.execute.mock.calls.some(([sql,args])=>String(sql).includes("partner_commission_ledger")&&args?.[4]===250&&args?.[5]==="2500"&&args?.[6]==="97500")).toBe(true);
  expect(tx.execute.mock.calls.some(([sql,args])=>String(sql).includes("UPDATE price_snapshots")&&args?.[1]==="R1"&&args?.[2]==="2500")).toBe(true);
 });
 it("fails closed if the snapshotted rule is no longer active before persistence",async()=>{
  const tx={query:vi.fn().mockResolvedValue([]),execute:vi.fn()};
  const repo=new PostgresBookingRepository();
  await expect(repo.persistCommercialPath(tx as never,{bookingId:"b6",partnerId:"p1",commercial:{path:"COMMISSIONABLE",ruleVersion:"R1"},price:{currency:"LAK",baseAmount:"100000",feesAmount:"0",couponAmount:"0",pointsBenefitAmount:"0",customerTotal:"100000",priceQuoteId:"q1"}})).rejects.toThrow("COMMISSION_RULE_NOT_CONFIGURED");
  expect(tx.execute).not.toHaveBeenCalled();
 });
});