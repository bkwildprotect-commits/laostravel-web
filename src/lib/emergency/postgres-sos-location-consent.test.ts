import {describe,expect,it,vi} from "vitest";import {grantSosLocationConsent,shareSosLocation,SosLocationConsentError} from "./postgres-sos-location-consent";
describe("location consent",()=>{
 it("requires booking ownership to grant consent",async()=>{const p={query:vi.fn().mockResolvedValue({rows:[]})};await expect(grantSosLocationConsent(p as never,{bookingId:"b1",travellerUserId:"u1"})).rejects.toBeInstanceOf(SosLocationConsentError)});
 it("requires active consent before sharing coordinates",async()=>{const p={query:vi.fn().mockResolvedValue({rows:[]})};await expect(shareSosLocation(p as never,{bookingId:"b1",travellerUserId:"u1",latitude:18.9,longitude:102.4})).rejects.toMatchObject({code:"ACTIVE_CONSENT_REQUIRED"})});
});
