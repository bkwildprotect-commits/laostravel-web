import {describe,expect,it,vi} from "vitest";
import {activatePartnerCommercially,PartnerCommercialActivationError} from "./postgres-commercial-activation";

describe("Partner commercial activation",()=>{
 it("activates only an approved DRAFT Partner and starts the per-Partner six-month free period",async()=>{
  const tx={
   query:vi.fn()
    .mockResolvedValueOnce([{verification_status:"APPROVED",business_status:"DRAFT"}])
    .mockResolvedValueOnce([{verification_status:"APPROVED",business_status:"ACTIVE"}])
    .mockResolvedValueOnce([]),
   execute:vi.fn().mockResolvedValue({rowCount:1})
  };
  await expect(activatePartnerCommercially(tx as never,{partnerId:"p1",actorUserId:"admin"}))
   .resolves.toEqual({businessStatus:"ACTIVE",commercialModel:"LAUNCH_FREE"});
  expect(tx.execute.mock.calls[0][0]).toContain("business_status='ACTIVE'");
  expect(tx.execute.mock.calls[1][0]).toContain("interval '6 months'");
  expect(tx.execute.mock.calls[3][0]).toContain("PARTNER_COMMERCIALLY_ACTIVATED");
 });
 it("fails closed before final verification approval",async()=>{
  const tx={query:vi.fn().mockResolvedValue([{verification_status:"PENDING",business_status:"DRAFT"}]),execute:vi.fn()};
  await expect(activatePartnerCommercially(tx as never,{partnerId:"p1",actorUserId:"admin"}))
   .rejects.toMatchObject({code:"PARTNER_NOT_APPROVED"} satisfies Partial<PartnerCommercialActivationError>);
  expect(tx.execute).not.toHaveBeenCalled();
 });
});
