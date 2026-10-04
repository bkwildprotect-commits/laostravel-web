import {describe,expect,it,vi} from "vitest";
import {PartnerVerificationDocumentConflictError,PartnerVerificationDocumentNotFoundError,reviewPartnerVerificationDocument} from "./postgres-verification-review";

function pool(query:ReturnType<typeof vi.fn>){return {connect:vi.fn().mockResolvedValue({query,release:vi.fn()})}}

describe("partner verification document review",()=>{
 it("reviews and audits in one transaction",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({})
   .mockResolvedValueOnce({rows:[{partner_id:"p1"}]})
   .mockResolvedValueOnce({rows:[]})
   .mockResolvedValueOnce({});
  await expect(reviewPartnerVerificationDocument(pool(query) as never,{reviewerUserId:"admin1",documentId:"d1",decision:"APPROVED"})).resolves.toBeUndefined();
  expect(String(query.mock.calls[1][0])).toContain("status='PENDING'");
  expect(String(query.mock.calls[2][0])).toContain("audit_logs");
  expect(query.mock.calls[2][1][1]).toBe("admin1");
  expect(query.mock.calls[3][0]).toBe("COMMIT");
 });
 it("fails closed when a previously reviewed document is reviewed again",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({})
   .mockResolvedValueOnce({rows:[]})
   .mockResolvedValueOnce({rows:[{exists:true}]})
   .mockResolvedValueOnce({});
  await expect(reviewPartnerVerificationDocument(pool(query) as never,{reviewerUserId:"admin1",documentId:"d1",decision:"REJECTED"})).rejects.toBeInstanceOf(PartnerVerificationDocumentConflictError);
  expect(query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
 });
 it("distinguishes a missing document",async()=>{
  const query=vi.fn()
   .mockResolvedValueOnce({})
   .mockResolvedValueOnce({rows:[]})
   .mockResolvedValueOnce({rows:[{exists:false}]})
   .mockResolvedValueOnce({});
  await expect(reviewPartnerVerificationDocument(pool(query) as never,{reviewerUserId:"admin1",documentId:"missing",decision:"APPROVED"})).rejects.toBeInstanceOf(PartnerVerificationDocumentNotFoundError);
 });
});
