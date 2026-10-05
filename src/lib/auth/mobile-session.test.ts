import {describe,it,expect,vi} from "vitest";
import {readMobileSession} from "./mobile-session";
describe("Mobile server-authoritative session",()=>{
 it("rejects inactive or missing mapped users before reading memberships",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[]});
  await expect(readMobileSession({query} as never,"u1")).rejects.toMatchObject({code:"AUTH_INVALID"});
  expect(query).toHaveBeenCalledTimes(1);
  expect(query.mock.calls[0][0]).toContain("u.status='ACTIVE'");
 });
 it("returns only owned memberships and requires approved active business",async()=>{
  const query=vi.fn().mockResolvedValueOnce({rows:[{id:"u1",email:"traveller@example.com",display_name:"Traveller"}]}).mockResolvedValueOnce({rows:[
   {id:"p1",name:"Approved",verification_status:"APPROVED",business_status:"ACTIVE"},
   {id:"p2",name:"Pending",verification_status:"PENDING",business_status:"ACTIVE"},
   {id:"p3",name:"Suspended",verification_status:"APPROVED",business_status:"SUSPENDED"}
  ]}).mockResolvedValueOnce({rows:[{status:"UNDER_REVIEW"}]});
  const result=await readMobileSession({query} as never,"u1");
  expect(result.partners.map(p=>p.canManage)).toEqual([true,false,false]);
  expect(result.applicationStatus).toBe("UNDER_REVIEW");
  expect(query.mock.calls[1][0]).toContain("pm.user_id=$1");
  expect(query.mock.calls.map(c=>c[1])).toEqual([["u1"],["u1"],["u1"]]);
  expect(query.mock.calls.every(c=>!/^\s*(INSERT|UPDATE)/i.test(c[0]))).toBe(true);
 });
});
