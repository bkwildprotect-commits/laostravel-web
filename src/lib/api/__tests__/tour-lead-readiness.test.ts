import {describe,it,expect} from "vitest";import {getTourLeadReadiness} from "../tour-lead-readiness";
const secret="0123456789abcdef0123456789abcdef";const databaseUrl="postgresql://test:test@localhost:5432/laostravel_test";
describe("tour lead readiness",()=>{
 it("fails closed with no configuration",()=>{const r=getTourLeadReadiness({});expect(r.ready).toBe(false);expect(r.approved).toBe(false);expect(r.missing).toContain("TOUR_LEAD_RATE_LIMIT_SECRET");expect(r.missing).toContain("DATABASE_URL")});
 it("does not open with a secret alone",()=>{expect(getTourLeadReadiness({TOUR_LEAD_RATE_LIMIT_SECRET:secret}).ready).toBe(false)});
 it("does not open with approval alone",()=>{expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true"}).ready).toBe(false)});
 it("does not open without a durable database",()=>{const r=getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true",TOUR_LEAD_RATE_LIMIT_SECRET:secret});expect(r.ready).toBe(false);expect(r.missing).toContain("DATABASE_URL")});
 it("rejects a configured but weak secret",()=>{const r=getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true",TOUR_LEAD_RATE_LIMIT_SECRET:"too-short",DATABASE_URL:databaseUrl});expect(r.ready).toBe(false);expect(r.invalid).toContain("TOUR_LEAD_RATE_LIMIT_SECRET")});
 it("requires exact lowercase true approval",()=>{expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"TRUE",TOUR_LEAD_RATE_LIMIT_SECRET:secret,DATABASE_URL:databaseUrl}).ready).toBe(false);expect(getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"1",TOUR_LEAD_RATE_LIMIT_SECRET:secret,DATABASE_URL:databaseUrl}).ready).toBe(false)});
 it("opens only when all required configuration and explicit approval are present",()=>{const r=getTourLeadReadiness({TOUR_LEAD_API_APPROVED:"true",TOUR_LEAD_RATE_LIMIT_SECRET:secret,DATABASE_URL:databaseUrl});expect(r.ready).toBe(true);expect(r.missing).toEqual([]);expect(r.invalid).toEqual([]);expect(r.approved).toBe(true)});
});
