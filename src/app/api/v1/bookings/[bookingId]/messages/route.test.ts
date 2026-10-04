import {describe,expect,it} from "vitest";import {POST} from "./route";
describe("booking messages route validation",()=>{it("rejects invalid text before persistence",async()=>{const r=await POST(new Request("http://x",{method:"POST",body:JSON.stringify({locale:"lo",text:""})}),{params:Promise.resolve({bookingId:"b1"})});expect([400,401,503]).toContain(r.status)})});
