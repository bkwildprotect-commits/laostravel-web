import type {TransactionContext} from "@/lib/infrastructure/transaction";import type {BookingTransactionRepository,CommercialAllocation} from "./repository";
export class PostgresBookingRepository implements BookingTransactionRepository{
 async claimIdempotency(tx:TransactionContext,userId:string,key:string,requestHash:string){const rows=await tx.query<{request_hash:string;status:string}>("SELECT request_hash,status FROM booking_idempotency WHERE user_id=$1 AND idempotency_key=$2 FOR UPDATE",[userId,key]);if(rows[0]){if(rows[0].request_hash!==requestHash)return "CONFLICT" as const;return rows[0].status==="COMPLETED"?"REPLAY" as const:"IN_PROGRESS" as const}const r=await tx.execute("INSERT INTO booking_idempotency(id,user_id,idempotency_key,request_hash,status,expires_at) VALUES(gen_random_uuid(),$1,$2,$3,'PROCESSING',now()+interval '24 hours') ON CONFLICT(user_id,idempotency_key) DO NOTHING",[userId,key,requestHash]);return r.rowCount===1?"CLAIMED" as const:"IN_PROGRESS" as const}
 async resolveBookingOwnership(tx:TransactionContext,input:{serviceId:string;availabilityId:string}){const r=await tx.query<{partner_id:string}>("SELECT s.partner_id FROM availability a JOIN services s ON s.id=a.service_id JOIN partners p ON p.id=s.partner_id WHERE a.id=$2 AND s.id=$1 AND s.status='ACTIVE' AND p.verification_status='APPROVED' AND p.business_status='ACTIVE' FOR SHARE OF a,s,p",[input.serviceId,input.availabilityId]);if(!r[0])throw new Error("BOOKING_TARGET_NOT_FOUND");return {partnerId:r[0].partner_id}}
 async getCompletedIdempotentBooking(tx:TransactionContext,userId:string,key:string){const r=await tx.query<{booking_id:string;booking_ref:string}>("SELECT b.id booking_id,b.booking_ref FROM booking_idempotency i JOIN bookings b ON b.id=i.booking_id WHERE i.user_id=$1 AND i.idempotency_key=$2 AND i.status='COMPLETED'",[userId,key]);return r[0]?{bookingId:r[0].booking_id,bookingRef:r[0].booking_ref}:null}
 async lockAvailability(tx:TransactionContext,id:string){const r=await tx.query<{remaining:number|null}>("SELECT remaining FROM availability WHERE id=$1 FOR UPDATE",[id]);if(!r[0])throw new Error("AVAILABILITY_NOT_FOUND");return r[0]}
 async reserveInventory(tx:TransactionContext,id:string,quantity:number){const current=await tx.query<{remaining:number|null;version:number}>("SELECT remaining,version FROM availability WHERE id=$1",[id]);if(!current[0])return null as never;if(current[0].remaining===null)return {remaining:null,version:current[0].version};const r=await tx.query<{remaining:number;version:number}>("UPDATE availability SET remaining=remaining-$2,version=version+1 WHERE id=$1 AND remaining >= $2 RETURNING remaining,version",[id,quantity]);return r[0]??null as never}
 async lockPartnerCommercialTerms(tx:TransactionContext,partnerId:string){await tx.query("SELECT id FROM partners WHERE id=$1 FOR UPDATE",[partnerId])}
 async allocateCommercialPath(tx:TransactionContext,input:{partnerId:string}):Promise<CommercialAllocation>{
  const terms=await tx.query<{model:string;free_ends_at:string|null}>("SELECT model,free_ends_at FROM partner_commercial_terms WHERE partner_id=$1 FOR UPDATE",[input.partnerId]);
  const term=terms[0];
  if(term?.model==="LAUNCH_FREE"&&term.free_ends_at&&new Date(term.free_ends_at).getTime()>Date.now())return {path:"LAUNCH_FREE",freeEndsAt:term.free_ends_at};
  // Expiry never silently activates commission. A separately accepted COMMISSION term is required.
  if(term?.model!=="COMMISSION")throw new Error("PARTNER_COMMERCIAL_TERMS_REQUIRED");
  const rules=await tx.query<{version:string}>("SELECT version FROM commission_rules WHERE status='ACTIVE' AND service_category IS NULL AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now()) ORDER BY effective_from DESC LIMIT 1");
  return {path:"COMMISSIONABLE",ruleVersion:rules[0]?.version??"UNRESOLVED"};
 }
 async createBooking(tx:TransactionContext,input:Parameters<BookingTransactionRepository["createBooking"]>[1]){
  if(input.commercial.path==="COMMISSIONABLE"&&input.commercial.ruleVersion==="UNRESOLVED")throw new Error("COMMISSION_RULE_NOT_CONFIGURED");
  const ids=await tx.query<{id:string}>("SELECT gen_random_uuid() id");const bookingId=ids[0].id;const bookingRef="LT-"+bookingId.replace(/-/g,"").slice(0,12).toUpperCase();
  await tx.execute("INSERT INTO bookings(id,booking_ref,user_id,status,payment_status) VALUES($1,$2,$3,'REQUESTED','UNPAID')",[bookingId,bookingRef,input.userId]);
  await tx.execute("INSERT INTO booking_items(id,booking_id,service_id,availability_id,quantity) VALUES(gen_random_uuid(),$1,$2,$3,$4)",[bookingId,input.serviceId,input.availabilityId,input.quantity]);
  await tx.execute("INSERT INTO price_snapshots(booking_id,price_quote_id,currency,base_amount,fees_amount,partner_discount_amount,coupon_amount,points_benefit_amount,customer_total,commission_rule_version) VALUES($1,$10::uuid,$2,$3::bigint,$4::bigint,$5::bigint,$6::bigint,$7::bigint,$8::bigint,$9)",[bookingId,input.price.currency,input.price.baseAmount,input.price.feesAmount,input.price.partnerDiscountAmount,input.price.couponAmount,input.price.pointsBenefitAmount,input.price.customerTotal,input.commercial.path==="COMMISSIONABLE"?input.commercial.ruleVersion:null,input.price.priceQuoteId]);
  return {bookingId,bookingRef};
 }
 async consumePriceQuote(tx:TransactionContext,input:{priceQuoteId:string;bookingId:string}){const r=await tx.execute("UPDATE price_quotes SET consumed_at=now(),consumed_booking_id=$2 WHERE id=$1 AND consumed_at IS NULL AND consumed_booking_id IS NULL",[input.priceQuoteId,input.bookingId]);if(r.rowCount!==1)throw new Error("PRICE_QUOTE_ALREADY_CONSUMED")}
 async persistCommercialPath(tx:TransactionContext,input:{bookingId:string;partnerId:string;commercial:CommercialAllocation;price:import("./repository").BookingPriceSnapshot}){
  if(input.commercial.path==="COMMISSIONABLE"){
   if(!input.commercial.ruleVersion||input.commercial.ruleVersion==="UNRESOLVED")throw new Error("COMMISSION_RULE_NOT_CONFIGURED");
   const rules=await tx.query<{rate_bps:number}>("SELECT rate_bps FROM commission_rules WHERE version=$1 AND status='ACTIVE' AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now()) FOR SHARE",[input.commercial.ruleVersion]);
   const rule=rules[0];if(!rule)throw new Error("COMMISSION_RULE_NOT_CONFIGURED");
   const basis=BigInt(input.price.baseAmount);const commission=basis*BigInt(rule.rate_bps)/BigInt(10000);const partner=basis-commission;
   await tx.execute("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'COMMISSIONABLE')",[input.bookingId,input.partnerId]);
   await tx.execute("INSERT INTO partner_commission_ledger(id,partner_id,booking_id,commercial_path,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version) VALUES(gen_random_uuid(),$1,$2,'COMMISSIONABLE','PENDING',$3,$4::bigint,$5,$6::bigint,$7::bigint,$8)",[input.partnerId,input.bookingId,input.price.currency,input.price.baseAmount,rule.rate_bps,commission.toString(),partner.toString(),input.commercial.ruleVersion]);
   await tx.execute("UPDATE price_snapshots SET commission_rule_version=$2,commission_amount=$3::bigint,partner_amount=$4::bigint WHERE booking_id=$1",[input.bookingId,input.commercial.ruleVersion,commission.toString(),partner.toString()]);
   return;
  }
  await tx.execute("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'LAUNCH_FREE')",[input.bookingId,input.partnerId])
 }
 async attachInventoryToBooking(tx:TransactionContext,input:Parameters<BookingTransactionRepository["attachInventoryToBooking"]>[1]){await tx.execute("INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) SELECT gen_random_uuid(),service_id,$2,$1,$3,'ACTIVE',now()+($4::text || ' minutes')::interval FROM availability WHERE id=$2",[input.bookingId,input.availabilityId,input.quantity,input.holdMinutes])}
 async completeIdempotency(tx:TransactionContext,input:{userId:string;key:string;bookingId:string}){await tx.execute("UPDATE booking_idempotency SET booking_id=$3,status='COMPLETED' WHERE user_id=$1 AND idempotency_key=$2 AND status='PROCESSING'",[input.userId,input.key,input.bookingId])}
 async writeAudit(tx:TransactionContext,input:{actorUserId:string;action:string;targetType:string;targetId:string}){await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id) VALUES(gen_random_uuid(),$1,$2,$3,$4)",[input.actorUserId,input.action,input.targetType,input.targetId])}
}
