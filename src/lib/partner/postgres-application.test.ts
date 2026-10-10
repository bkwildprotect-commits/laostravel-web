import {describe,expect,it,vi} from "vitest";
import {PartnerApplicationValidationError,submitPartnerApplication,validatePartnerApplication} from "./postgres-application";
const valid={category:"tour-activity",businessName:"River Tour",contactName:"Noy",email:"n@example.com",phone:"020123",area:"Vang Vieng"};
describe("partner application",()=>{
 it.each([null,[],{}, {...valid,businessName:""},{...valid,email:42},{...valid,phone:{}},{...valid,idempotencyKey:3}])("rejects malformed intake without TypeError",input=>expect(()=>validatePartnerApplication(input)).toThrow(PartnerApplicationValidationError));
 it("persists submitted intake and audit in one transaction using authenticated owner",async()=>{
  const q=vi.fn(async(sql:string,params?:readonly unknown[])=>{void params;return {rows:sql.startsWith("INSERT INTO partner_applications")?[{id:"a1"}]:[],rowCount:1}});
  const pool={connect:vi.fn().mockResolvedValue({query:q,release:vi.fn()})};
  await expect(submitPartnerApplication(pool as never,"u1",valid)).resolves.toEqual({applicationId:"a1",status:"SUBMITTED"});
  expect(q.mock.calls.find(c=>c[0].startsWith("INSERT INTO partner_applications"))?.[1]?.[0]).toBe("u1");
  expect(q.mock.calls.some(c=>c[0].includes("PARTNER_APPLICATION_SUBMITTED"))).toBe(true);expect(q.mock.calls.at(-1)?.[0]).toBe("COMMIT");
 });
});
