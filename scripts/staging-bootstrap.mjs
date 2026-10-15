// Provider runner: offline plan by default. Never invoked automatically by CI/deploy.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,basename} from 'node:path';
import pg from 'pg';
export const projectRef='fnsszfomslvpxghjukid';
const root=fileURLToPath(new URL('../',import.meta.url));
const digest=s=>createHash('sha256').update(s).digest('hex');
export function buildPlan(directory=root){
 const files=JSON.parse(readFileSync(resolve(directory,'scripts/bootstrap-manifest.json'),'utf8'));
 const expected=['docs/backend/database-schema.sql',...readdirSync(resolve(directory,'db/migrations')).filter(f=>f.endsWith('.sql')).sort().map(f=>'db/migrations/'+f)];
 if(JSON.stringify(files)!==JSON.stringify(expected))throw new Error('MANIFEST_INCOMPLETE');
 const checksums=JSON.parse(readFileSync(resolve(directory,'scripts/bootstrap-checksums.json'),'utf8'));
 if(Object.keys(checksums).length!==files.length+1)throw new Error('CHECKSUM_MANIFEST_INCOMPLETE');
 const units=[...files,'db/staging/client-isolation.sql'].map(path=>{
  const sql=readFileSync(resolve(directory,path),'utf8');const sha256=digest(sql);
  if(checksums[path]!==sha256)throw new Error('CHECKSUM_MISMATCH');
  return {path,sha256,sql};
 });
 // Include runner bytes: the approval binds SQL and execution/preflight logic.
 const hash=digest(JSON.stringify({version:1,projectRef,units:units.map(({path,sha256})=>({path,sha256})),runner:digest(readFileSync(fileURLToPath(import.meta.url),'utf8'))}));
 return {projectRef,hash,units};
}
export function validateTarget(env,apply,hash){
 const u=new URL(env.STAGING_DATABASE_URL??'');
 const direct=u.hostname===`db.${projectRef}.supabase.co` && decodeURIComponent(u.username)==='postgres';
 const session=/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(u.hostname) && decodeURIComponent(u.username)===`postgres.${projectRef}`;
 const allowed=['sslmode','sslrootcert'];
 if(!['postgres:','postgresql:'].includes(u.protocol)||(!direct&&!session)||u.pathname!=='/postgres'||(u.port&&u.port!=='5432')||u.hash||u.searchParams.get('sslmode')!=='verify-full'||!u.searchParams.get('sslrootcert')||[...u.searchParams.keys()].some(k=>!allowed.includes(k))||[...new Set(u.searchParams.keys())].some(k=>u.searchParams.getAll(k).length!==1))throw new Error('STAGING_TARGET_OR_TLS_INVALID');
 if(env.BOOKING_API_APPROVED==='true'||env.PARTNER_EVIDENCE_UPLOAD_APPROVED==='true')throw new Error('STAGING_GATES_MUST_REMAIN_CLOSED');
 if(apply && env.STAGING_MIGRATION_APPROVAL!==`${projectRef}:${hash}`)throw new Error('OWNER_APPROVAL_FOR_EXACT_PLAN_REQUIRED');
 return u.toString();
}
export function transactionBody(sql){
 // Strip only standalone outer transaction delimiters; preserve DO blocks.
 return sql.replace(/^BEGIN;\s*$/gm,'').replace(/^COMMIT;\s*$/gm,'');
}
export async function assertEmptyProductSchema(client){
 const r=await client.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN('r','p','v','m','f','S')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')`);
 if(r.rows.length)throw new Error('PUBLIC_SCHEMA_NOT_EMPTY');
 const ops=await client.query("SELECT to_regnamespace('laostravel_staging_ops') AS existing");
 if(ops.rows[0].existing)throw new Error('STAGING_BOOTSTRAP_ALREADY_EXISTS');
}
export async function applyPlan(client,plan){
 await client.query('BEGIN');
 try{
  await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s'");
  await client.query("SELECT pg_advisory_xact_lock(20261010,34)");
  await assertEmptyProductSchema(client);
  await client.query("SET LOCAL laostravel.staging_isolation_approved='yes'");
  for(const unit of plan.units)await client.query(transactionBody(unit.sql));
  const versions=await client.query('SELECT version FROM public.schema_migrations ORDER BY version');
  const expected=plan.units.filter(u=>u.path.startsWith('db/migrations/')).map(u=>basename(u.path,'.sql')).sort();
  if(JSON.stringify(versions.rows.map(r=>r.version))!==JSON.stringify(expected))throw new Error('MIGRATION_HISTORY_MISMATCH');
  const leaked=await client.query("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND NOT relrowsecurity");
  if(leaked.rows.length)throw new Error('RLS_INCOMPLETE');
  await client.query('CREATE SCHEMA laostravel_staging_ops; REVOKE ALL ON SCHEMA laostravel_staging_ops FROM PUBLIC');
  await client.query('CREATE TABLE laostravel_staging_ops.bootstrap_runs(plan_hash text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()); ALTER TABLE laostravel_staging_ops.bootstrap_runs ENABLE ROW LEVEL SECURITY; REVOKE ALL ON laostravel_staging_ops.bootstrap_runs FROM PUBLIC');
  await client.query(`DO $$ DECLARE r text; BEGIN
   FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
     EXECUTE format('REVOKE ALL ON SCHEMA laostravel_staging_ops FROM %I',r);
     EXECUTE format('REVOKE ALL ON laostravel_staging_ops.bootstrap_runs FROM %I',r);
    END IF;
   END LOOP;
  END $$`);
  await client.query('INSERT INTO laostravel_staging_ops.bootstrap_runs(plan_hash) VALUES($1)',[plan.hash]);
  await client.query('COMMIT');
  return {applied:true,migrations:expected.length,planHash:plan.hash};
 }catch(error){await client.query('ROLLBACK');throw error;}
}
export async function main(args=process.argv.slice(2),env=process.env){
 if(args.length>1||!['--plan','--check','--apply',undefined].includes(args[0]))throw new Error('USE_PLAN_CHECK_OR_APPLY');
 const plan=buildPlan();const mode=args[0]??'--plan';
 if(mode==='--plan')return {mode:'offline-plan',projectRef,planHash:plan.hash,files:plan.units.map(({path,sha256})=>({path,sha256})),requiresOwnerApproval:true};
 const connectionString=validateTarget(env,mode==='--apply',plan.hash);
 const client=new pg.Client({connectionString,connectionTimeoutMillis:8000,application_name:'laostravel-staging-bootstrap'});
 try{
  await client.connect();
  const tls=await client.query('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()');
  if(tls.rows[0]?.ssl!==true)throw new Error('VERIFIED_TLS_REQUIRED');
  if(mode==='--check'){
   await client.query('BEGIN READ ONLY');
   try{await assertEmptyProductSchema(client);return {mode:'read-only-check',projectRef,empty:true,ssl:true,planHash:plan.hash};}
   finally{await client.query('ROLLBACK');}
  }
  return await applyPlan(client,plan);
 }finally{await client.end();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().then(r=>console.log(JSON.stringify(r,null,2))).catch(()=>{console.error('STAGING_BOOTSTRAP_BLOCKED_OR_FAILED: verify target, TLS, checksum, owner approval and empty schema; credentials and SQL errors are intentionally not logged.');process.exitCode=1;});
}
