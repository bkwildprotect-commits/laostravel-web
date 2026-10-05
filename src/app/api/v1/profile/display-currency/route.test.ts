import {beforeEach,describe,it,expect,vi} from "vitest";
import {AuthenticationError} from "../../../../../lib/auth/authentication";
import {DisplayCurrencyPreferenceError} from "../../../../../lib/profile/postgres-display-currency";
const mocks=vi.hoisted(()=>({authenticate:vi.fn(),update:vi.fn(),pool:{}}));
vi.mock("../../../../../lib/auth/runtime",()=>({getRuntimeAuthenticationAdapter:()=>({authenticate:mocks.authenticate})}));
vi.mock("../../../../../lib/infrastructure/postgres-runtime",()=>({getPostgresPool:()=>mocks.pool}));
vi.mock("../../../../../lib/profile/postgres-display-currency",async importOriginal=>{
 const actual=await importOriginal<typeof import("../../../../../lib/profile/postgres-display-currency")>();
 return {...actual,updateDisplayCurrencyPreference:mocks.update};
});
import {POST} from "./route";

const request=(body:string)=>new Request("https://backend.example/api/v1/profile/display-currency",
 {method:"POST",headers:{"content-type":"application/json"},body});
describe("display currency preference API",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it("uses the verified mapped user and ignores client-authored identity",async()=>{
  mocks.authenticate.mockResolvedValueOnce({userId:"mapped-user",subject:"external"});
  mocks.update.mockResolvedValueOnce({preferredDisplayCurrency:"JPY"});
  const response=await POST(request(JSON.stringify({userId:"admin",preferredDisplayCurrency:"JPY"})));
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(mocks.pool,"mapped-user","JPY");
  expect((await response.json()).data).toEqual({preferredDisplayCurrency:"JPY"});
  expect(response.headers.get("cache-control")).toBe("no-store");
 });
 it.each(["AUTH_REQUIRED","AUTH_INVALID","AUTH_NOT_CONFIGURED"] as const)("fails closed for %s",async code=>{
  mocks.authenticate.mockRejectedValueOnce(new AuthenticationError(code));
  const response=await POST(request('{"preferredDisplayCurrency":"LAK"}'));
  expect(response.status).toBe(code==="AUTH_NOT_CONFIGURED"?503:401);
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("rejects malformed and unsupported preferences without exposing internals",async()=>{
  mocks.authenticate.mockResolvedValue({userId:"u1",subject:"external"});
  let response=await POST(request("{"));
  expect(response.status).toBe(400);expect(mocks.update).not.toHaveBeenCalled();
  mocks.update.mockRejectedValueOnce(new DisplayCurrencyPreferenceError("INVALID_DISPLAY_CURRENCY"));
  response=await POST(request('{"preferredDisplayCurrency":"BTC"}'));
  expect(response.status).toBe(400);expect((await response.json()).error.code).toBe("INVALID_DISPLAY_CURRENCY");
 });
 it("sanitizes database failures",async()=>{
  const log=vi.spyOn(console,"error").mockImplementation(()=>{});
  mocks.authenticate.mockResolvedValueOnce({userId:"u1",subject:"external"});
  mocks.update.mockRejectedValueOnce(new Error("private database url"));
  const response=await POST(request('{"preferredDisplayCurrency":"LAK"}'));
  expect(response.status).toBe(500);expect(await response.text()).not.toContain("private database url");log.mockRestore();
 });
});
