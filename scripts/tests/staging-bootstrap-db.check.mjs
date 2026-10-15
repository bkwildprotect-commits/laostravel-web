// Native PostgreSQL CI only, with its own empty disposable database.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {buildPlan,applyPlan} from '../staging-bootstrap.mjs';
const enabled=process.env.RUN_STAGING_RUNNER_TESTS==='1';
test('atomic rollback, full bootstrap, isolated roles and repeat refusal on native PostgreSQL',{skip:!enabled},async()=>{
 const raw=process.env.STAGING_RUNNER_TEST_URL??'';const url=new URL(raw);
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/laostravel_staging_runner_test');
 const client=new pg.Client({connectionString:raw});await client.connect();
 try{
  const plan=buildPlan();
  await assert.rejects(applyPlan(client,{...plan,units:[...plan.units,{path:'synthetic-failure',sql:'SELECT * FROM synthetic_missing_table;'}]}));
  assert.equal((await client.query("SELECT to_regclass('public.users') AS product")).rows[0].product,null);
  assert.equal((await client.query("SELECT to_regclass('public.schema_migrations') AS product")).rows[0].product,null);
  const result=await applyPlan(client,plan);assert.equal(result.migrations,36);
  assert.equal((await client.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n,50);
  for(const role of ['anon','authenticated']){
   const grants=await client.query("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND has_table_privilege($1,oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')",[role]);
   assert.equal(grants.rows.length,0);
  }
  await client.query('SET ROLE authenticated');
  await assert.rejects(client.query('SELECT * FROM public.auth_identities'),{code:'42501'});
  await assert.rejects(client.query('SELECT * FROM laostravel_staging_ops.bootstrap_runs'),{code:'42501'});
  await client.query('RESET ROLE');
  assert.equal((await client.query('SELECT plan_hash FROM laostravel_staging_ops.bootstrap_runs')).rows[0].plan_hash,plan.hash);
  await assert.rejects(applyPlan(client,plan),/PUBLIC_SCHEMA_NOT_EMPTY/);
 }finally{await client.end();}
});
