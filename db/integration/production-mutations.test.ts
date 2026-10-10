import {submitPartnerApplication} from "../../src/lib/partner/postgres-application";
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
import {createAuthoritativeQuote} from "../../src/lib/pricing/postgres-quote-engine";
import {createBookingAtomically} from "../../src/lib/booking/orchestrator";
import {PostgresBookingRepository} from "../../src/lib/booking/postgres-repository";
import {activatePartnerCommercially} from "../../src/lib/partner/postgres-commercial-activation";
import {settleCommissionEntry} from "../../src/lib/commission/postgres-settlement";

// Only an explicitly enabled disposable CI database may run these tests.
const enabled=process.env.RUN_DB_MUTATION_TESTS==="1";
describe.skipIf(!enabled)("production mutations on disposable PostgreSQL",()=>{
 let pool:Pool;
 const user=randomUUID(),partner=randomUUID(),service=randomUUID();
 beforeAll(async()=>{
  pool=new Pool({connectionString:process.env.DATABASE_URL});
  await pool.query("INSERT INTO users(id,email) VALUES($1,$2)",[user,`${user}@example.invalid`]);
  await pool.query("INSERT INTO partners(id,name,verification_status,business_status) VALUES($1,'Mutation Regression','APPROVED','ACTIVE')",[partner]);
  await pool.query("INSERT INTO services(id,partner_id,category,status,booking_mode) VALUES($1,$2,'TOUR','ACTIVE','CAPACITY')",[service,partner]);
  await pool.query("INSERT INTO service_area_assignments(service_id,area_code) SELECT $1,code FROM service_areas WHERE commercial_status='BOOKING_ENABLED' LIMIT 1",[service]);
  await pool.query("INSERT INTO service_price_offers(id,service_id,currency,unit_amount,status,effective_from) VALUES($1,$2,'LAK',100,'ACTIVE',now()-interval '1 day')",[randomUUID(),service]);
  await pool.query("INSERT INTO partner_commercial_terms(partner_id,model,free_started_at,free_ends_at) VALUES($1,'LAUNCH_FREE',now(),now()+interval '6 months')",[partner]);
  process.env.BOOKING_HOLD_MINUTES='15';
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
  await pool.query("INSERT INTO availability(id,service_id,remaining,capacity,starts_at) VALUES($1,$2,2,5,now()+interval '1 day')",[availability,service]);
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
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='PARTNER_VERIFICATION_DECIDED'",[partner])).rows[0].metadata).toEqual({fromStatus:"APPROVED",toStatus:"REJECTED"});
  await pool.query("UPDATE partners SET verification_status='APPROVED' WHERE id=$1",[partner]);
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
  await pool.query("INSERT INTO partner_commission_ledger(id,partner_id,booking_id,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version,commercial_terms_version) VALUES($1,$2,$3,'EARNED','LAK',100,1000,10,90,'regression-v1','terms-v1')",[ledger,partner,id]);
  await pool.query("UPDATE bookings SET payment_status='PAID' WHERE id=$1",[id]);
  await settleCommissionEntry(pool,{ledgerId:ledger,actorUserId:user,settlementReference:"regression-reference"});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE target_id=$1 AND action='COMMISSION_SETTLED'",[ledger])).rows[0].metadata).toEqual({partnerId:partner,bookingId:id,settlementReference:"regression-reference"});
 });
 async function commissionBooking(status="COMPLETED",terms:string|null="terms-v1"){
  const id=await booking(status),ledger=randomUUID();
  await pool.query("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'COMMISSIONABLE')",[id,partner]);
  await pool.query("INSERT INTO partner_commission_ledger(id,partner_id,booking_id,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version,commercial_terms_version) VALUES($1,$2,$3,'PENDING','LAK',100,1000,10,90,'regression-v1',$4)",[ledger,partner,id,terms]);
  return {id,ledger};
 }
 async function ledgerStatus(id:string){return (await pool.query("SELECT status FROM partner_commission_ledger WHERE booking_id=$1",[id])).rows[0].status}
 async function pay(id:string,to:"PAID"|"REFUNDED"|"DISPUTED"){return transitionBookingPayment(pool,{bookingId:id,actorUserId:user,to,reason:"regression"})}
 it("qualifies only completed paid bookings and holds disputes without duplicate earning",async()=>{
  const {id}=await commissionBooking();
  expect(await ledgerStatus(id)).toBe("PENDING");
  await pay(id,"PAID");expect(await ledgerStatus(id)).toBe("EARNED");
  await expect(pay(id,"PAID")).rejects.toMatchObject({code:"INVALID_PAYMENT_TRANSITION"});
  await pay(id,"DISPUTED");expect(await ledgerStatus(id)).toBe("PENDING");
  await pay(id,"PAID");expect(await ledgerStatus(id)).toBe("EARNED");
  await pay(id,"REFUNDED");expect(await ledgerStatus(id)).toBe("REVERSED");
  await expect(pay(id,"DISPUTED")).rejects.toMatchObject({code:"INVALID_PAYMENT_TRANSITION"});
  expect((await pool.query("SELECT count(*)::int n FROM partner_commission_ledger WHERE booking_id=$1",[id])).rows[0].n).toBe(1);
 });
 it("qualifies payment-before-completion only when completion actually commits",async()=>{
  const {id}=await commissionBooking("IN_SERVICE");await pay(id,"PAID");expect(await ledgerStatus(id)).toBe("PENDING");
  await new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event:"COMPLETE",actorUserId:user}));expect(await ledgerStatus(id)).toBe("EARNED");
 });
 it("blocks earning and settlement without historical accepted terms",async()=>{
  const {id,ledger}=await commissionBooking("COMPLETED",null);await pay(id,"PAID");expect(await ledgerStatus(id)).toBe("PENDING");
  await expect(settleCommissionEntry(pool,{ledgerId:ledger,actorUserId:user,settlementReference:"blocked"})).rejects.toMatchObject({code:"COMMISSION_NOT_EARNED"});
 });
 it("serializes concurrent refund and settlement and prevents further settlement",async()=>{
  const {id,ledger}=await commissionBooking();await pay(id,"PAID");
  const results=await Promise.allSettled([pay(id,"REFUNDED"),settleCommissionEntry(pool,{ledgerId:ledger,actorUserId:user,settlementReference:"race"})]);
  expect(results[0].status).toBe("fulfilled");expect(await ledgerStatus(id)).toBe("REVERSED");
  await expect(settleCommissionEntry(pool,{ledgerId:ledger,actorUserId:user,settlementReference:"repeat"})).rejects.toMatchObject({code:"COMMISSION_NOT_EARNED"});
 });
 it.each(["past","unknown","closed","no-price"])("never credits a %s capacity slot",async mode=>{
  const {id,availability}=await heldBooking();
  if(mode==="past")await pool.query("UPDATE availability SET starts_at=now()-interval '1 minute' WHERE id=$1",[availability]);
  if(mode==="unknown")await pool.query("UPDATE availability SET starts_at=NULL WHERE id=$1",[availability]);
  if(mode==="no-price")await pool.query("UPDATE service_price_offers SET effective_until=now() WHERE service_id=$1",[service]);
  if(mode==="closed")await pool.query("UPDATE services SET status='DRAFT' WHERE id=$1",[service]);
  await new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event:"CANCEL"}));
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(2);
  await pool.query("UPDATE services SET status='ACTIVE' WHERE id=$1",[service]);
  await pool.query("UPDATE service_price_offers SET effective_until=NULL WHERE service_id=$1",[service]);
 });
 it("restores confirmed unused future capacity once even under concurrent cancellation",async()=>{
  const {id,availability}=await heldBooking();
  await pool.query("UPDATE bookings SET status='CONFIRMED' WHERE id=$1",[id]);await pool.query("UPDATE inventory_holds SET status='CONSUMED' WHERE booking_id=$1",[id]);
  const adapter=new PostgresTransactionAdapter(pool);
  const results=await Promise.allSettled([1,2].map(()=>adapter.run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event:"CANCEL"}))));
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(5);
 });
 async function request(availability:string,key:string){
  const date=(await pool.query("SELECT starts_at::date::text AS date FROM availability WHERE id=$1",[availability])).rows[0].date;
  const quote=await createAuthoritativeQuote(pool,{serviceId:service,availabilityId:availability,date,quantity:1});
  return {userId:user,idempotencyKey:key,requestHash:key,bookingRequest:{serviceId:service,date,quantity:1,availabilityToken:quote.availabilityToken,priceQuoteId:quote.priceQuoteId,idempotencyKey:key,traveller:{name:"Regression",email:"test@example.invalid"}}};
 }
 it("executes real concurrent booking requests without overselling",async()=>{
  const availability=randomUUID();await pool.query("INSERT INTO availability(id,service_id,remaining,capacity,starts_at) VALUES($1,$2,1,1,now()+interval '2 days')",[availability,service]);
  const inputs=await Promise.all([request(availability,randomUUID()),request(availability,randomUUID())]);
  const results=await Promise.allSettled(inputs.map(input=>createBookingAtomically(new PostgresTransactionAdapter(pool),new PostgresBookingRepository(),input)));
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(0);
 });
 it("replays concurrent identical requests once and rejects changed payloads",async()=>{
  const availability=randomUUID();await pool.query("INSERT INTO availability(id,service_id,remaining,capacity,starts_at) VALUES($1,$2,2,2,now()+interval '2 days')",[availability,service]);
  const input=await request(availability,randomUUID()),run=(value= input)=>createBookingAtomically(new PostgresTransactionAdapter(pool),new PostgresBookingRepository(),value);
  const results=await Promise.all([run(),run()]);expect(results[0].bookingId).toBe(results[1].bookingId);
  expect(results.filter(r=>r.replayed)).toHaveLength(1);
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(1);
  await expect(run({...input,requestHash:"changed"})).rejects.toMatchObject({code:"IDEMPOTENCY_CONFLICT"});
 });
 it("does not activate a verified partner without a ready service in an open area",async()=>{
  const p=randomUUID();await pool.query("INSERT INTO partners(id,name,verification_status,business_status) VALUES($1,'Not ready','APPROVED','DRAFT')",[p]);
  await expect(new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>activatePartnerCommercially(tx,{partnerId:p,actorUserId:user}))).rejects.toMatchObject({code:"PARTNER_NO_BOOKABLE_SERVICE"});
  expect((await pool.query("SELECT business_status FROM partners WHERE id=$1",[p])).rows[0].business_status).toBe("DRAFT");
  expect((await pool.query("SELECT count(*)::int n FROM partner_commercial_terms WHERE partner_id=$1",[p])).rows[0].n).toBe(0);
 });

 it("starts six calendar months only when verified services are ready in an open area",async()=>{
  const p=randomUUID(),s=randomUUID();
  await pool.query("INSERT INTO partners(id,name,verification_status,business_status) VALUES($1,'Ready Partner','APPROVED','DRAFT')",[p]);
  await pool.query("INSERT INTO services(id,partner_id,category,status,booking_mode,service_kind) VALUES($1,$2,'HOTEL','ACTIVE','CAPACITY','STAY')",[s,p]);
  await pool.query("INSERT INTO service_area_assignments(service_id,area_code) SELECT $1,code FROM service_areas WHERE commercial_status='BOOKING_ENABLED' LIMIT 1",[s]);
  await pool.query("INSERT INTO availability(id,service_id,starts_at,remaining,capacity) VALUES($1,$2,now()+interval '1 day',1,1)",[randomUUID(),s]);
  await pool.query("INSERT INTO service_price_offers(id,service_id,currency,unit_amount,status,effective_from) VALUES($1,$2,'LAK',100,'ACTIVE',now()-interval '1 day')",[randomUUID(),s]);
  const adapter=new PostgresTransactionAdapter(pool);
  await adapter.run("SERIALIZABLE",tx=>activatePartnerCommercially(tx,{partnerId:p,actorUserId:user}));
  expect((await pool.query("SELECT free_ends_at=free_started_at+interval '6 months' AS six_months FROM partner_commercial_terms WHERE partner_id=$1",[p])).rows[0].six_months).toBe(true);
  await expect(adapter.run("SERIALIZABLE",tx=>activatePartnerCommercially(tx,{partnerId:p,actorUserId:user}))).rejects.toMatchObject({code:"PARTNER_ALREADY_ACTIVE"});
 });
 it.each(["CHECKED_IN","CONFIRMED"])("does not restore used/check-in or no-show capacity from %s",async status=>{
  const {id,availability}=await heldBooking();await pool.query("UPDATE bookings SET status=$2 WHERE id=$1",[id,status]);await pool.query("UPDATE inventory_holds SET status='CONSUMED' WHERE booking_id=$1",[id]);
  await new PostgresTransactionAdapter(pool).run("SERIALIZABLE",tx=>mutateBookingLifecycle(tx,{bookingId:id,event:status==="CONFIRMED"?"MARK_NO_SHOW":"CANCEL"}));
  expect((await pool.query("SELECT remaining FROM availability WHERE id=$1",[availability])).rows[0].remaining).toBe(2);
 });

 it("concurrent application retry creates one intake and one audit without approving Partner",async()=>{
  const key=randomUUID(),input={category:"hotel",businessName:"Real Intake",contactName:"Owner",email:"owner@example.invalid",phone:"020123",area:"Champasak",idempotencyKey:key};
  const results=await Promise.all([submitPartnerApplication(pool,user,input),submitPartnerApplication(pool,user,input)]);
  expect(results[0]).toEqual(results[1]);
  const id=results[0].applicationId;
  expect((await pool.query("SELECT status,partner_id FROM partner_applications WHERE id=$1",[id])).rows[0]).toEqual({status:"SUBMITTED",partner_id:null});
  expect(Number((await pool.query("SELECT count(*) FROM audit_logs WHERE action='PARTNER_APPLICATION_SUBMITTED' AND target_id=$1",[id])).rows[0].count)).toBe(1);
  await expect(submitPartnerApplication(pool,user,{...input,businessName:"Changed"})).rejects.toMatchObject({code:"IDEMPOTENCY_CONFLICT"});
  expect(Number((await pool.query("SELECT count(*) FROM partner_application_idempotency WHERE user_id=$1 AND idempotency_key=$2",[user,key])).rows[0].count)).toBe(1);
 });
 it.each(["unverified","inactive","closed-area","past"])("does not issue quotes for %s targets",async mode=>{
  const {availability}=await heldBooking();
  const area=(await pool.query("SELECT area_code FROM service_area_assignments WHERE service_id=$1 LIMIT 1",[service])).rows[0].area_code;
  try{
   if(mode==="unverified")await pool.query("UPDATE partners SET verification_status='PENDING' WHERE id=$1",[partner]);
   if(mode==="inactive")await pool.query("UPDATE services SET status='DRAFT' WHERE id=$1",[service]);
   if(mode==="closed-area")await pool.query("DELETE FROM service_area_assignments WHERE service_id=$1",[service]);
   if(mode==="past")await pool.query("UPDATE availability SET starts_at=now()-interval '1 minute' WHERE id=$1",[availability]);
   const date=(await pool.query("SELECT starts_at::date::text AS date FROM availability WHERE id=$1",[availability])).rows[0].date;
   await expect(createAuthoritativeQuote(pool,{serviceId:service,availabilityId:availability,date,quantity:1})).rejects.toMatchObject({code:"AVAILABILITY_NOT_FOUND"});
   expect(Number((await pool.query("SELECT count(*) FROM price_quotes WHERE availability_id=$1",[availability])).rows[0].count)).toBe(0);
  }finally{
   await pool.query("UPDATE partners SET verification_status='APPROVED' WHERE id=$1",[partner]);
   await pool.query("UPDATE services SET status='ACTIVE' WHERE id=$1",[service]);
   await pool.query("INSERT INTO service_area_assignments(service_id,area_code) VALUES($1,$2) ON CONFLICT DO NOTHING",[service,area]);
  }
 });

});
