import {readFileSync,readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {describe,expect,it} from "vitest";
import {publicAuthConfiguration} from "../../src/lib/client/connected-backend";
import {getBookingApiReadiness} from "../../src/lib/booking/api-readiness";
import {getProductionReadiness} from "../../src/lib/infrastructure/production-readiness";

const read=(path:string)=>readFileSync(path,"utf8");
const manifest=JSON.parse(read("scripts/bootstrap-manifest.json")) as string[];
describe("Staging preparation invariants",()=>{
 it("lists every migration once in deterministic order, including repeated numeric prefixes",()=>{
  expect(manifest[0]).toBe("docs/backend/database-schema.sql");
  expect(manifest.slice(1)).toEqual(readdirSync("db/migrations").filter(f=>f.endsWith(".sql")).sort().map(f=>`db/migrations/${f}`));
  expect(new Set(manifest).size).toBe(manifest.length);
  expect(manifest.filter(f=>/\/0025_/.test(f))).toHaveLength(2);
  expect(manifest.filter(f=>/\/0027_/.test(f))).toHaveLength(2);
 });
 it("hardening covers every product table from base schema and migrations",()=>{
  const names=new Set(manifest.flatMap(f=>Array.from(read(f).matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi),m=>m[1])));
  const sql=read("db/staging/client-isolation.sql");
  for(const table of names)expect(sql).toContain(`'${table}'`);
 });
 it("bootstrap runner refuses missing acknowledgement or remote target before starting psql",()=>{
  for(const env of [{RUN_DB_BOOTSTRAP_TESTS:"0"},{RUN_DB_BOOTSTRAP_TESTS:"1",DATABASE_URL:"postgresql://synthetic:synthetic@production.invalid/postgres"}]){
   const result=spawnSync(process.execPath,["scripts/run-db-bootstrap.mjs"],{env:{NODE_ENV:"test",PATH:process.env.PATH,...env},encoding:"utf8"});
   expect(result.status).toBe(2);
   expect(result.stderr).not.toContain("Bootstrap failed");
  }
 });
 it("placeholder template keeps booking and evidence gates closed",()=>{
  const lines=read(".env.example").split("\n").filter(l=>l&&!l.startsWith("#"));
  const env=Object.fromEntries(lines.map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
  expect(env.BOOKING_API_APPROVED).toBe("false");
  expect(env.PARTNER_EVIDENCE_UPLOAD_APPROVED).toBe("false");
  expect(getBookingApiReadiness(env).ready).toBe(false);
  expect(getProductionReadiness(env).ready).toBe(false);
  expect(()=>publicAuthConfiguration(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)).toThrow();
 });
 it.each(["sb_secret_synthetic","service_role","sb_publishable_"])("forbids private or incomplete browser keys: %s",key=>{
  expect(()=>publicAuthConfiguration("https://staging.supabase.co",key)).toThrow();
 });
});
