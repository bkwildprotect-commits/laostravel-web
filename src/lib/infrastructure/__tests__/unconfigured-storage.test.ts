import {afterEach,describe,expect,it,vi} from "vitest";
import {UnconfiguredStorageAdapter} from "../adapters/unconfigured";
afterEach(()=>vi.unstubAllEnvs());
describe("private evidence placeholder storage health",()=>{
 it("cannot claim permission readiness from bucket metadata or approval flags",async()=>{
  vi.stubEnv("OBJECT_STORAGE_ENDPOINT","https://staging.supabase.co/storage/v1");
  vi.stubEnv("OBJECT_STORAGE_BUCKET","synthetic-private-bucket");
  vi.stubEnv("PARTNER_EVIDENCE_UPLOAD_APPROVED","true");
  expect(await new UnconfiguredStorageAdapter().health()).toMatchObject({name:"storage",status:"unconfigured"});
 });
 it("remains unconfigured without a bucket",async()=>{
  vi.stubEnv("OBJECT_STORAGE_BUCKET","");
  expect(await new UnconfiguredStorageAdapter().health()).toMatchObject({status:"unconfigured",detail:expect.stringContaining("OBJECT_STORAGE_BUCKET")});
 });
});
