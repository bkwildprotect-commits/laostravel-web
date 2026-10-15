import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildPlan,validateTarget,transactionBody,projectRef} from '../staging-bootstrap.mjs';
const plan=buildPlan();
const env={STAGING_DATABASE_URL:`postgresql://postgres.${projectRef}:synthetic@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=/synthetic/ca.crt`};
test('offline plan covers 36 migrations, base schema and hardening; SHA256 binds bytes',()=>{
 assert.equal(plan.units.length,38);assert.match(plan.hash,/^[a-f0-9]{64}$/);
 assert.equal(plan.units.filter(u=>u.path.includes('/0025_')).length,2);
 assert.equal(plan.units.filter(u=>u.path.includes('/0027_')).length,2);
 for(const u of plan.units)assert.match(u.sha256,/^[a-f0-9]{64}$/);
});
test('provider target accepts only Staging project with verified TLS',()=>assert.ok(validateTarget(env,false,plan.hash)));
test('apply rejects missing/wrong/stale approval before network access',()=>{
 for(const approval of [undefined,'approved',`${projectRef}:old`])assert.throws(()=>validateTarget({...env,STAGING_MIGRATION_APPROVAL:approval},true,plan.hash));
 assert.ok(validateTarget({...env,STAGING_MIGRATION_APPROVAL:`${projectRef}:${plan.hash}`},true,plan.hash));
});
test('refuses other project, insecure TLS, credential overrides and transaction pooler',()=>{
 for(const url of [env.STAGING_DATABASE_URL.replace(projectRef,'production'),env.STAGING_DATABASE_URL.replace('verify-full','require'),env.STAGING_DATABASE_URL.replace(':5432',':6543'),env.STAGING_DATABASE_URL+'&ssl=false',env.STAGING_DATABASE_URL+'&sslmode=disable','postgresql://postgres:synthetic@db.production.supabase.co/postgres'])assert.throws(()=>validateTarget({...env,STAGING_DATABASE_URL:url},false,plan.hash));
});
test('refuses opening booking/evidence gates during bootstrap',()=>{
 for(const key of ['BOOKING_API_APPROVED','PARTNER_EVIDENCE_UPLOAD_APPROVED'])assert.throws(()=>validateTarget({...env,[key]:'true'},false,plan.hash));
});
test('outer transaction stripping preserves DO-block BEGIN',()=>{
 assert.equal(transactionBody('BEGIN;\nDO $$\nBEGIN\n NULL;\nEND $$;\nCOMMIT;'), '\nDO $$\nBEGIN\n NULL;\nEND $$;\n');
});
test('CLI errors do not disclose connection credentials',()=>{
 const result=spawnSync(process.execPath,['scripts/staging-bootstrap.mjs','--apply'],{env:{...process.env,...env,STAGING_MIGRATION_APPROVAL:'wrong'},encoding:'utf8'});
 assert.equal(result.status,1);assert.ok(!result.stderr.includes('synthetic'));assert.ok(!result.stderr.includes(env.STAGING_DATABASE_URL));
});

test('checksum validation rejects SQL drift before a connection can be made',()=>{
 const directory=mkdtempSync(join(tmpdir(),'laostravel-plan-'));
 try{
  for(const path of ['scripts/bootstrap-manifest.json','scripts/bootstrap-checksums.json',...plan.units.map(u=>u.path)]){
   cpSync(resolve(path),join(directory,path),{recursive:true});
  }
  const file=join(directory,'db/migrations/0034_partner_application_idempotency.sql');
  writeFileSync(file,readFileSync(file,'utf8')+'\n-- synthetic drift\n');
  assert.throws(()=>buildPlan(directory),/CHECKSUM_MISMATCH/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
