import {beforeEach,describe,it,expect,vi} from "vitest";
import {AuthenticationError} from "../../../../lib/auth/authentication";
import {PartnerApplicationConflictError,PartnerApplicationValidationError} from "../../../../lib/partner/postgres-application";
const mocks=vi.hoisted(()=>({authenticate:vi.fn(),submit:vi.fn(),pool:{}}));
vi.mock("../../../../lib/auth/runtime",()=>({getRuntimeAuthenticationAdapter:()=>({authenticate:mocks.authenticate})}));
vi.mock("../../../../lib/infrastructure/postgres-runtime",()=>({getPostgresPool:()=>mocks.pool}));
vi.mock("../../../../lib/partner/postgres-application",async original=>({...await original<typeof import("../../../../lib/partner/postgres-application")>(),submitPartnerApplication:mocks.submit}));
import {POST} from "./route";
describe("authenticated Partner application API",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it.each(["AUTH_REQUIRED","AUTH_INVALID","AUTH_NOT_CONFIGURED"] as const)("rejects %s before persistence",async code=>{mocks.authenticate.mockRejectedValue(new AuthenticationError(code));const r=await POST(new Request("https://web.example/api/v1/partner-applications",{method:"POST",body:"{}"}));expect(r.status).toBe(code==="AUTH_NOT_CONFIGURED"?503:401);expect(mocks.submit).not.toHaveBeenCalled()});
 it("uses mapped owner even when the body attempts to impersonate admin",async()=>{mocks.authenticate.mockResolvedValue({userId:"mapped"});mocks.submit.mockResolvedValue({applicationId:"a",status:"SUBMITTED"});const input={userId:"admin",role:"ADMIN",idempotencyKey:"original-key"};const r=await POST(new Request("https://web.example/api/v1/partner-applications",{method:"POST",body:JSON.stringify(input)}));expect(r.status).toBe(201);expect(mocks.submit).toHaveBeenCalledWith(mocks.pool,"mapped",input)});
 it.each([[new PartnerApplicationValidationError(["email"]),400,"PARTNER_APPLICATION_INVALID"],[new PartnerApplicationConflictError("IDEMPOTENCY_CONFLICT"),409,"IDEMPOTENCY_CONFLICT"],[Object.assign(new Error("private SQL detail"),{code:"22P02"}),400,"VALIDATION_ERROR"]])("maps errors without leaking SQL",async(error,status,code)=>{mocks.authenticate.mockResolvedValue({userId:"mapped"});mocks.submit.mockRejectedValue(error);const r=await POST(new Request("https://web.example/api/v1/partner-applications",{method:"POST",body:"{}"}));expect(r.status).toBe(status);const body=await r.json();expect(body.error.code).toBe(code);expect(JSON.stringify(body)).not.toContain("private SQL detail")});
});
