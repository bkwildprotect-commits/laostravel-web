import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {resolve} from "node:path";
describe("partner location API security contract",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/app/api/v1/partners/[partnerId]/location/route.ts"),"utf8");
 it("requires authenticated partner membership",()=>{expect(source).toContain("AuthenticationError");expect(source).toContain("LocationAccessDeniedError");expect(source).toContain("status:403")});
 it("does not accept verification state from partner input",()=>{expect(source).not.toContain("v.verificationStatus");expect(source).not.toContain("verifiedAt")});
});
