import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("../../../../../lib/booking/api-readiness",()=>({getBookingApiReadiness:vi.fn()}));
vi.mock("../../../../../lib/auth/runtime",()=>({getRuntimeAuthenticationAdapter:vi.fn()}));
vi.mock("../../../../../lib/booking/runtime",()=>({executeBooking:vi.fn()}));
import {POST} from "../route";
import {getBookingApiReadiness} from "../../../../../lib/booking/api-readiness";
import {getRuntimeAuthenticationAdapter} from "../../../../../lib/auth/runtime";
import {executeBooking} from "../../../../../lib/booking/runtime";
import {AuthenticationError} from "../../../../../lib/auth/authentication";
import {BookingTransactionError} from "../../../../../lib/booking/transaction-errors";
const valid={serviceId:"s1",date:"2030-01-01",availabilityToken:"tok",priceQuoteId:"q1",quantity:1,traveller:{name:"Traveller",email:"t@example.com"},idempotencyKey:"idem-123456"};
const request=(body:unknown)=>new Request("http://localhost/api/v1/bookings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getBookingApiReadiness).mockReturnValue({ready:true});vi.mocked(getRuntimeAuthenticationAdapter).mockReturnValue({authenticate:vi.fn(async()=>({userId:"u1",subject:"sub1"}))});vi.mocked(executeBooking).mockResolvedValue({bookingId:"b1",bookingRef:"LT-1",replayed:false});});
describe("POST /api/v1/bookings",()=>{
 it("fails closed before auth when readiness is false",async()=>{vi.mocked(getBookingApiReadiness).mockReturnValue({ready:false,missing:["DATABASE_URL"]});const r=await POST(request(valid));expect(r.status).toBe(503);expect(executeBooking).not.toHaveBeenCalled()});
 it("rejects unauthenticated requests",async()=>{vi.mocked(getRuntimeAuthenticationAdapter).mockReturnValue({authenticate:vi.fn(async()=>{throw new AuthenticationError("AUTH_REQUIRED")})});const r=await POST(request(valid));expect(r.status).toBe(401);expect(executeBooking).not.toHaveBeenCalled()});
 it("uses server-authenticated user id for atomic execution",async()=>{const r=await POST(request({...valid,userId:"attacker"}));expect(r.status).toBe(201);expect(executeBooking).toHaveBeenCalledWith({userId:"u1",request:valid})});
 it("maps booking transaction errors without exposing internals",async()=>{vi.mocked(executeBooking).mockRejectedValue(new BookingTransactionError("INVENTORY_UNAVAILABLE","Inventory unavailable",409));const r=await POST(request(valid));expect(r.status).toBe(409);expect(await r.json()).toMatchObject({error:{code:"INVENTORY_UNAVAILABLE"}})});
});
