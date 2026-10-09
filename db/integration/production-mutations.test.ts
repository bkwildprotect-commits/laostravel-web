import {randomUUID} from "node:crypto";
import {Pool, type PoolClient} from "pg";
import {describe,it,expect,beforeAll,afterAll} from "vitest";
import {PostgresTransactionAdapter} from "../../src/lib/infrastructure/postgres-transaction";
import type {TransactionContext} from "../../src/lib/infrastructure/transaction";
import {mutateBookingLifecycle} from "../../src/lib/booking/postgres-lifecycle";
import {grantCompletionReward} from "../../src/lib/rewards/postgres-completion-reward";
import {transitionBookingPayment} from "../../src/lib/payment/postgres-status-transition";
import {decidePartnerVerification} from "../../src/lib/partner/postgres-verification-decision";
import {approvePartnerApplication} from "../../src/lib/partner/postgres-application-review";
import {settleCommissionEntry} from "../../src/lib/commission/postgres-settlement";

// Only an explicitly enabled disposable CI database may run these tests.
const enabled=process.env.RUN_DB_MUTATION_TESTS==="1";
describe.skipIf(!enabled)("production mutations on disposable PostgreSQL",()=>{
 let pool:Pool;
 const user=randomUUID(),partner=randomUUID(),service=randomUUID();
 beforeAll(async()=>{
  pool=new Pool({connectionString:process.env.DATABASE_URL});
  await pool.query("INSERT INTO users(id,email) VALUES($1,$2)",[user,`${user}@example.invalid`]);
  await pool.query("INSERT INTO partners(id,name) VALUES($1,'Mutation Regression')",[partner]);
  await pool.query("INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES($1,$2,'TOUR','ACTIVE','CAPACITY')",[service,partner]);
 });
 afterAll(async()=>{await pool.end()});
 async function booking(status="REQUESTED"){
  const id=randomUUID();
  await pool.query("INSERT INTO bookings(id,booking_ref,user_id,status) VALUES($1,$2,$3,$4)",[id,`REG-${id}`,user,status]);
  return id;
 }
 function context(client:PoolClient):TransactionContext{
  return {
   query:async<T>(sql:string,params?:readonly unknown[]) => (await client.query<T & Record<string,unknown>>(sql,params as unknown[])).rows,
   execute:async(sql,params) => ({rowCount:(await client.query(sql,params as unknown[])).rowCount??0}),
  };
 }
 async function heldBooking(){
  const id=await booking(),availability=randomUUID();
  await pool.query("INSERT INTO availability(id,service_id,remaining,capacity) VALUES($1,$2,2,5)",[availability,service]);
  // Two holds on one row: restoration must sum both, not join arbitrarily.
  for(const quantity of [1,2]){
   await pool.query("INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) VALUES($1,$2,$3,$4,$5,'ACTIVE',now()+interval '15 minutes')",[randomUUID(),service,availability,id,quantity]);
  }
  return {id,availability};
 }
 it.each(["CANCEL","EXPIRE"] as const)("restores exactly once on %s including multi-item holds",async event=>{
  const {id,availability}=await heldBooking();
  const adapter=new PostgresTransactionAdapter(pool);
  await adapter.run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event}));
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(5);
  await expect(adapter.run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event}))).rejects.toThrow();
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(5);
 });
 it("rolls back booking, hold, restoration and audit together on failure",async()=>{
  const {id,availability}=await heldBooking();
  await expect(new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event:"CANCEL",actorUserId:randomUUID()}))).rejects.toThrow();
  expect((await pool.query("SELECT status FROM bookings WHERE id=$1",[id])).rows[0].status).toBe("REQUESTED");
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(2);
  expect((await pool.query("SELECT DISTINCT status FROM inventory_holds WHERE booking_id=$1",[id])).rows).toEqual([{status:"ACTIVE"}]);
  expect((await pool.query("SELECT count(*)::int AS n FROM audit_logs WHERE target_id=$1",[id])).rows[0].n).toBe(0);
 });
 it("arbitrates concurrent completion rewards without double credit",async()=>{
  const id=await booking("COMPLETED");
  async function grant(){
   const client=await pool.connect();
   try{
    await client.query("BEGIN");
    const result=await grantCompletionReward(context(client),{bookingId:id,userId:user,points:10});
    await client.query("COMMIT");return result;
   }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
  }
  const results=await Promise.all([grant(),grant()]);
  expect(results.filter(r=>r.granted)).toHaveLength(1);
  expect(results.filter(r=>!r.granted)).toHaveLength(1);
  expect((await pool.query("SELECT count(*)::int AS n,sum(points)::text AS balance FROM points_ledger WHERE booking_id=$1 AND user_id=$2",[id,user])).rows[0]).toEqual({n:1,balance:"10"});
 });
 it("commits payment status and typed audit metadata together",async()=>{
  const id=await booking();
  await transitionBookingPayment(pool,{bookingId:id,actorUserId:user,to:"PAID",reason:"Confirmed direct payment"});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='PAYMENT_STATUS_CHANGED'",[id])).rows[0].metadata).toEqual({fromStatus:"UNPAID",toStatus:"PAID",reason:"Confirmed direct payment"});
 });
 it("commits final verification and audit metadata together",async()=>{
  await decidePartnerVerification(pool,{partnerId:partner,actorUserId:user,decision:"REJECTED"});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='PARTNER_VERIFICATION_DECIDED'",[partner])).rows[0].metadata).toEqual({fromStatus:"DRAFT",toStatus:"REJECTED"});
 });
 it("approves an application with an auditable new partner identity",async()=>{
  const id=randomUUID();
  await pool.query("INSERT INTO partner_applications(id,applicant_user_id,category,business_name,contact_name,email,phone,operating_area) VALUES($1,$2,'transport','Regression Co','Tester','test@example.invalid','000','Vang Vieng')",[id,user]);
  const result=await approvePartnerApplication(pool,{applicationId:id,actorUserId:user});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='PARTNER_APPLICATION_APPROVED'",[id])).rows[0].metadata).toEqual({partnerId:result.partnerId});
 });
 it("settles an earned commission with its unchanged audit identifiers",async()=>{
  const id=await booking("COMPLETED"),ledger=randomUUID();
  await pool.query("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'COMMISSIONABLE')",[id,partner]);
  await pool.query("INSERT INTO partner_commission_ledger(id,partner_id,booking_id,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version) VALUES($1,$2,$3,'EARNED','LAK',100,1000,10,90,'regression-v1')",[ledger,partner,id]);
  await settleCommissionEntry(pool,{ledgerId:ledger,actorUserId:user,settlementReference:"regression-reference"});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='COMMISSION_SETTLED'",[ledger])).rows[0].metadata).toEqual({partnerId:partner,bookingId:id,settlementReference:"regression-reference"});
 });
});
