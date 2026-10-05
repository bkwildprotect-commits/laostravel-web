import {afterEach,describe,expect,it,vi} from "vitest";
import {GET,dynamic} from "./route";

afterEach(()=>vi.unstubAllEnvs());

describe("production readiness API",()=>{
 it("is dynamic, uncached and reflects current runtime configuration",async()=>{
  vi.stubEnv("DATABASE_URL","");
  vi.stubEnv("BOOKING_HOLD_MINUTES","");
  vi.stubEnv("AUTH_ISSUER_URL","");
  vi.stubEnv("AUTH_AUDIENCE","");
  vi.stubEnv("OBJECT_STORAGE_ENDPOINT","");
  vi.stubEnv("OBJECT_STORAGE_BUCKET","");
  vi.stubEnv("BOOKING_API_APPROVED","false");
  vi.stubEnv("PARTNER_EVIDENCE_UPLOAD_APPROVED","false");
  const response=await GET();
  expect(dynamic).toBe("force-dynamic");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await response.json()).data).toMatchObject({ready:false});
 });
});
