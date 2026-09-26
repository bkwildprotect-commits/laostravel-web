import {describe,it,expect} from "vitest";import {POST} from "./route";
const url="http://localhost/api/v1/tour-leads";
const validBody={name:"Test User",phone:"+856 20 5555 5555",email:"test@example.com",date:"2026-10-10",guests:2,consent:true};
function request(body:unknown,key?:string){const headers=new Headers({"content-type":"application/json"});if(key)headers.set("idempotency-key",key);return new Request(url,{method:"POST",headers,body:JSON.stringify(body)})}
describe("POST /api/v1/tour-leads",()=>{
 it("rejects missing idempotency key",async()=>{const response=await POST(request(validBody));expect(response.status).toBe(400);expect((await response.json()).error.code).toBe("INVALID_IDEMPOTENCY_KEY")});
 it("rejects malformed idempotency key",async()=>{const response=await POST(request(validBody,"short"));expect(response.status).toBe(400);expect((await response.json()).error.code).toBe("INVALID_IDEMPOTENCY_KEY")});
 it("fails closed after valid contract validation while storage is unconfigured",async()=>{const response=await POST(request(validBody,"0123456789abcdef"));expect(response.status).toBe(503);expect((await response.json()).error.code).toBe("LEAD_STORAGE_NOT_CONFIGURED")});
});
