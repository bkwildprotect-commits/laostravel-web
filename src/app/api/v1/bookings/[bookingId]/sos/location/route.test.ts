import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({share:vi.fn(),authenticate:vi.fn()}));
vi.mock("@/lib/auth/runtime",()=>({getRuntimeAuthenticationAdapter:()=>({authenticate:mocks.authenticate})}));
vi.mock("@/lib/infrastructure/postgres-runtime",()=>({getPostgresPool:()=>({})}));
vi.mock("@/lib/emergency/postgres-sos-location-consent",()=>({shareSosLocation:mocks.share,SosLocationConsentError:class extends Error{}}));
vi.mock("@/lib/auth/authentication",()=>({AuthenticationError:class extends Error{}}));
import {POST} from "./route";
describe("SOS location input",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.authenticate.mockResolvedValue({userId:"u"});mocks.share.mockResolvedValue({shareId:"s"})});
 it.each([null,"",false,"0",{}])("rejects coerced coordinates (%j) before sharing",async latitude=>{
  const response=await POST(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({latitude,longitude:0})}),{params:Promise.resolve({bookingId:"b"})});
  expect(response.status).toBe(400);expect(mocks.share).not.toHaveBeenCalled();
 });
 it("accepts genuine numeric zero coordinates",async()=>{
  const response=await POST(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({latitude:0,longitude:0,accuracyM:0})}),{params:Promise.resolve({bookingId:"b"})});
  expect(response.status).toBe(201);expect(mocks.share).toHaveBeenCalledWith({},expect.objectContaining({latitude:0,longitude:0,accuracyM:0}));
 });
 it("rejects null accuracy instead of treating it as exact GPS",async()=>{
  const response=await POST(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({latitude:18,longitude:102,accuracyM:null})}),{params:Promise.resolve({bookingId:"b"})});
  expect(response.status).toBe(400);expect(mocks.share).not.toHaveBeenCalled();
 });
});
