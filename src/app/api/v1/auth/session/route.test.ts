import {beforeEach,describe,it,expect,vi} from "vitest";
import {AuthenticationError} from "../../../../../lib/auth/authentication";
const mocks=vi.hoisted(()=>({authenticate:vi.fn(),read:vi.fn(),pool:{}}));
vi.mock("../../../../../lib/auth/runtime",()=>({getRuntimeAuthenticationAdapter:()=>({authenticate:mocks.authenticate})}));
vi.mock("../../../../../lib/infrastructure/postgres-runtime",()=>({getPostgresPool:()=>mocks.pool}));
vi.mock("../../../../../lib/auth/mobile-session",()=>({readMobileSession:mocks.read}));
import {GET} from "./route";
describe("Mobile session API",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it.each(["AUTH_REQUIRED","AUTH_INVALID","AUTH_NOT_CONFIGURED"] as const)("fails closed for %s",async code=>{
  mocks.authenticate.mockRejectedValueOnce(new AuthenticationError(code));
  const response=await GET(new Request("https://backend.example/api/v1/auth/session"));
  expect(response.status).toBe(code==="AUTH_NOT_CONFIGURED"?503:401);
  expect((await response.json()).data).toBeNull();expect(mocks.read).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("no-store");
 });
 it("uses verified mapped user instead of client role or user id",async()=>{
  mocks.authenticate.mockResolvedValueOnce({userId:"mapped-user",subject:"external"});
  mocks.read.mockResolvedValueOnce({userId:"mapped-user",partners:[]});
  const response=await GET(new Request("https://backend.example/api/v1/auth/session?userId=admin",{headers:{"x-admin":"true"}}));
  expect(response.status).toBe(200);expect(mocks.read).toHaveBeenCalledWith(mocks.pool,"mapped-user");
  expect(response.headers.get("vary")).toBe("Authorization");
 });
 it("sanitizes database failures",async()=>{
  const log=vi.spyOn(console,"error").mockImplementation(()=>{});
  mocks.authenticate.mockResolvedValueOnce({userId:"u1",subject:"s"});mocks.read.mockRejectedValueOnce(new Error("private database url"));
  const response=await GET(new Request("https://backend.example/api/v1/auth/session"));
  expect(response.status).toBe(500);expect(await response.text()).not.toContain("private database url");log.mockRestore();
 });
});
