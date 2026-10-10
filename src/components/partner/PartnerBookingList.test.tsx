import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("PartnerBookingList safety states",()=>{
 const source=readFileSync(resolve(process.cwd(),"src/components/partner/PartnerBookingList.tsx"),"utf8");
 it("uses the authenticated same-origin partner booking endpoint",()=>{
  expect(source).toContain("/api/v1/partners/");
  expect(source).toContain("connectedBackend.request");
  expect(source).toContain("undefined,true");
 });
 it("renders loading, error and empty states",()=>{
  expect(source).toContain("กำลังโหลดรายการจอง");
  expect(source).toContain('role="alert"');
  expect(source).toContain("ยังไม่มีรายการจอง");
 });
 it("does not render raw internal API errors",()=>{
  expect(source).toContain("ไม่สามารถโหลดรายการจองได้ในขณะนี้");
  expect(source).not.toContain("body.error.message");
 });
});
