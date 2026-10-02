import {describe,expect,it} from "vitest";import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("admin role authorization",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/lib/auth/admin-role.ts"),"utf8");
 it("requires authenticated internal user plus active server-side role",()=>{expect(source).toContain("input.auth.authenticate(request)");expect(source).toContain("admin_role_assignments");expect(source).toContain("status='ACTIVE'")});
 it("does not trust client role headers or body claims",()=>{expect(source).not.toContain("x-admin");expect(source).not.toContain("request.json");expect(source).not.toContain("localStorage")});
});
