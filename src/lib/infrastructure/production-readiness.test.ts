import {describe,expect,it} from "vitest";
import {getCoreRuntimeConfigurationIssues,getProductionReadiness} from "./production-readiness";

const env={
 DATABASE_URL:"postgres://user:password@db.internal/laostravel",
 BOOKING_HOLD_MINUTES:"20",
 AUTH_ISSUER_URL:"https://issuer.example/auth/v1",
 AUTH_AUDIENCE:"laostravel",
 OBJECT_STORAGE_ENDPOINT:"https://storage.example/private",
 OBJECT_STORAGE_BUCKET:"private",
 BOOKING_API_APPROVED:"true",
 PARTNER_EVIDENCE_UPLOAD_APPROVED:"true",
};

describe("production readiness",()=>{
 it("opens only when runtime configuration and approval gates are valid",()=>{
  expect(getProductionReadiness(env)).toEqual({ready:true});
 });
 it("fails closed when private evidence storage is not approved",()=>{
  expect(getProductionReadiness({...env,PARTNER_EVIDENCE_UPLOAD_APPROVED:"false"}))
   .toEqual({ready:false,missing:["PARTNER_EVIDENCE_UPLOAD_APPROVED"]});
 });
 it("rejects malformed provider configuration rather than checking presence only",()=>{
  expect(getProductionReadiness({
   ...env,
   DATABASE_URL:"https://not-postgres.example",
   BOOKING_HOLD_MINUTES:"0",
   AUTH_ISSUER_URL:"http://issuer.example",
   OBJECT_STORAGE_ENDPOINT:"http://storage.example",
  })).toEqual({ready:false,missing:[
   "DATABASE_URL",
   "BOOKING_HOLD_MINUTES",
   "AUTH_ISSUER_URL",
   "OBJECT_STORAGE_ENDPOINT",
  ]});
 });
 it("rejects a cross-origin or insecure explicit JWKS endpoint",()=>{
  expect(getCoreRuntimeConfigurationIssues({
   ...env,AUTH_JWKS_URL:"https://attacker.example/jwks.json",
  })).toEqual(["AUTH_JWKS_URL"]);
  expect(getCoreRuntimeConfigurationIssues({
   ...env,AUTH_JWKS_URL:"http://issuer.example/jwks.json",
  })).toEqual(["AUTH_JWKS_URL"]);
 });
 it("reports absent provider configuration",()=>{
  expect(getProductionReadiness({})).toMatchObject({ready:false});
 });
});
