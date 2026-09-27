import {describe,it,expect} from "vitest";import {getTourLeadReadiness} from "../tour-lead-readiness";
describe("tour lead readiness",()=>{
 it("fails closed with no configuration",()=>{const r=getTourLeadReadiness({});expect(r.ready).toBe(false);expect(r.approved).toBe(false);expect(r.missing).toContain("TOUR_LEAD_RATE_LIMIT_SECRET")});
 it("does not open with a secret alone",()=>{expect(getTourLeadReadiness({TOUR_LEAD_RATE_LIMIT_SECRET:"0123456789abcdef0123456789abcdef"}).ready).toBe(false)});
 it("does not open with approval alone",()=>{expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true"}).ready).toBe(false)});
 it("rejects a configured but weak secret",()=>{const r=getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true",TOUR_LEAD_RATE_LIMIT_SECRET:"too-short"});expect(r.ready).toBe(false);expect(r.invalid).toContain("TOUR_LEAD_RATE_LIMIT_SECRET")});
 it("requires exact lowercase true approval",()=>{const secret="0123456789abcdef0123456789abcdef";expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"TRUE",TOUR_LEAD_RATE_LIMIT_SECRET:secret}).ready).toBe(false);expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"1",TOUR_LEAD_RATE_LIMIT_SECRET:secret}).ready).toBe(false)});
 it("opens only when required configuration and explicit approval are present",()=>{const r=getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true",TOUR_LEAD_RATE_LIMIT_SECRET:"0123456789abcdef0123456789abcdef"});expect(r.ready).toBe(true);expect(r.missing).toEqual([]);expect(r.approved).toBe(true)});
});
