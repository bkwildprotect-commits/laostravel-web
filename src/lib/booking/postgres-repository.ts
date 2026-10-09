import type {TransactionContext} from "@/lib/infrastructure/transaction";import type {BookingTransactionRepository,CommercialAllocation,TransportPickupSelection} from "./repository";import {BookingTransactionError} from "./transaction-errors";
export class PostgresBookingRepository implements BookingTransactionRepository{
 async claimIdempotency(tx:TransactionContext,userId:string,key:string,requestHash:string){const rows=await tx.query<{request_hash:string;status:string}>("SELECT request_hash,status FROM booking_idempotency WHERE user_id=$1 AND idempotency_key=$2 FOR UPDATE",[userId,key]);if(rows[0]){if(rows[0].request_hash!==requestHash)return "CONFLICT" as const;return rows[0].status==="COMPLETED"?"REPLAY" as const:"IN_PROGRESS" as const}const r=await tx.execute("INSERT INTO booking_idempotency(id,user_id,idempotency_key,request_hash,status,expires_at) VALUES(gen_random_uuid(),$1,$2,$3,'PROCESSING',now()+interval '24 hours') ON CONFLICT(user_id,idempotency_key) DO NOTHING",[userId,key,requestHash]);return r.rowCount===1?"CLAIMED" as const:"IN_PROGRESS" as const}
 async resolveBookingOwnership(tx:TransactionContext,input:{serviceId:string;availabilityId:string}){const r=await tx.query<{partner_id:string}>("SELECT s.partner_id FROM availability a JOIN services s ON s.id=a.service_id JOIN partners p ON p.id=s.partner_id WHERE a.id=$2 AND s.id=$1 AND s.status='ACTIVE' AND p.verification_status='APPROVED' AND p.business_status='ACTIVE' FOR SHARE OF a,s,p",[input.serviceId,input.availabilityId]);if(!r[0])throw new Error("BOOKING_TARGET_NOT_FOUND");return {partnerId:r[0].partner_id}}
 async assertCommercialServiceArea(tx:TransactionContext,serviceId:string){const r=await tx.query<{allowed:boolean}>("SELECT EXISTS(SELECT 1 FROM service_area_assignments saa JOIN service_areas sa ON sa.code=saa.area_code WHERE saa.service_id=$1 AND sa.commercial_status='BOOKING_ENABLED') AS allowed",[serviceId]);if(!r[0]?.allowed)throw new Error("SERVICE_AREA_NOT_BOOKABLE")}
 async resolveTransportPickupSelection(tx:TransactionContext,input:{serviceId:string;designatedStopId?:string}):Promise<TransportPickupSelection>{
  const service=await tx.query<{service_kind:string|null;vehicle_type:string|null}>("SELECT s.service_kind,sc.vehicle_type FROM services s LEFT JOIN service_capability_details sc ON sc.service_id=s.id WHERE s.id=$1 FOR SHARE OF s",[input.serviceId]);
  if(!service[0])throw new BookingTransactionError("BOOKING_TARGET_NOT_FOUND","Booking service is unavailable",404);
  if(service[0].service_kind!=="INTERCITY_TRANSPORT"){
   if(input.designatedStopId)throw new BookingTransactionError("DESIGNATED_STOP_NOT_ALLOWED","Designated stops apply only to intercity Bus bookings",409);
   return {mode:"NOT_INTERCITY"};
  }
  if(service[0].vehicle_type==="VIP_VAN"){
   if(input.designatedStopId)throw new BookingTransactionError("DESIGNATED_STOP_NOT_ALLOWED","VIP Van Smart Pickup is a separate operator-approved request",409);
   return {mode:"VIP_VAN"};
  }
  if(service[0].vehicle_type!=="BUS")throw new BookingTransactionError("INTERCITY_VEHICLE_NOT_CONFIGURED","Intercity vehicle type is unavailable",409);
  if(!input.designatedStopId)throw new BookingTransactionError("BUS_DESIGNATED_STOP_REQUIRED","A reviewed designated stop is required for Bus booking",409);
  const stop=await tx.query<{id:string;area_code:string;name_lo:string;name_en:string;stop_role:"BOARDING"|"BOTH";stop_order:number;latitude:string;longitude:string}>("SELECT id,area_code,name_lo,name_en,stop_role,stop_order,latitude::text,longitude::text FROM intercity_designated_stops WHERE id=$1 AND service_id=$2 AND active=true AND verification_status='VERIFIED' AND stop_role IN ('BOARDING','BOTH') FOR SHARE",[input.designatedStopId,input.serviceId]);
  if(!stop[0])throw new BookingTransactionError("BUS_DESIGNATED_STOP_INVALID","The selected Bus stop is not available for this service",409);
  return {mode:"BUS_DESIGNATED_STOP",stop:{id:stop[0].id,areaCode:stop[0].area_code,nameLo:stop[0].name_lo,nameEn:stop[0].name_en,role:stop[0].stop_role,order:stop[0].stop_order,latitude:stop[0].latitude,longitude:stop[0].longitude}};
 }
 async persistTransportPickupSelection(tx:TransactionContext,input:{bookingId:string;serviceId:string;selection:TransportPickupSelection}){
  if(input.selection.mode!=="BUS_DESIGNATED_STOP")return;
  const s=input.selection.stop;
  await tx.execute("INSERT INTO booking_designated_stop_snapshots(booking_id,service_id,source_stop_id,area_code,name_lo,name_en,stop_role,stop_order,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::numeric,$10::numeric)",[input.bookingId,input.serviceId,s.id,s.areaCode,s.nameLo,s.nameEn,s.role,s.order,s.latitude,s.longitude]);
 }
 async getCompletedIdempotentBooking(tx:TransactionContext,userId:string,key:string){const r=await tx.query<{booking_id:string;booking_ref:string}>("SELECT b.id booking_id,b.booking_ref FROM booking_idempotency i JOIN bookings b ON b.id=i.booking_id WHERE i.user_id=$1 AND i.idempotency_key=$2 AND i.status='COMPLETED'",[userId,key]);return r[0]?{bookingId:r[0].booking_id,bookingRef:r[0].booking_ref}:null}
 async lockAvailability(tx:TransactionContext,id:string){const r=await tx.query<{remaining:number|null}>("SELECT remaining FROM availability WHERE id=$1 FOR UPDATE",[id]);if(!r[0])throw new Error("AVAILABILITY_NOT_FOUND");return r[0]}
 async reserveInventory(tx:TransactionContext,id:string,quantity:number){const current=await tx.query<{remaining:number|null;version:number}>("SELECT remaining,version FROM availability WHERE id=$1",[id]);if(!current[0])return null as never;if(current[0].remaining===null)return {remaining:null,version:current[0].version};const r=await tx.query<{remaining:number;version:number}>("UPDATE availability SET remaining=remaining-$2,version=version+1 WHERE id=$1 AND remaining >= $2 RETURNING remaining,version",[id,quantity]);return r[0]??null as never}
 async lockPartnerCommercialTerms(tx:TransactionContext,partnerId:string){await tx.query("SELECT id FROM partners WHERE id=$1 FOR UPDATE",[partnerId])}
 async allocateCommercialPath(tx:TransactionContext,input:{partnerId:string}):Promise<CommercialAllocation>{
  const terms=await tx.query<{model:string;free_ends_at:string|null;accepted_terms_version:string|null}>("SELECT model,free_ends_at,accepted_terms_version FROM partner_commercial_terms WHERE partner_id=$1 FOR UPDATE",[input.partnerId]);
  const term=terms[0];
  if(term?.model==="LAUNCH_FREE"&&term.free_ends_at&&new Date(term.free_ends_at).getTime()>Date.now())return {path:"LAUNCH_FREE",freeEndsAt:term.free_ends_at};
  // Expiry never silently activates commission. A separately accepted COMMISSION term is required.
  if(term?.model!=="COMMISSION"||!term.accepted_terms_version?.trim())throw new Error("PARTNER_COMMERCIAL_TERMS_REQUIRED");
  const rules=await tx.query<{version:string}>("SELECT version FROM commission_rules WHERE status='ACTIVE' AND service_category IS NULL AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now()) ORDER BY effective_from DESC LIMIT 1");
  return {path:"COMMISSIONABLE",ruleVersion:rules[0]?.version??"UNRESOLVED",acceptedTermsVersion:term.accepted_terms_version};
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
   if(!input.commercial.acceptedTermsVersion?.trim())throw new Error("PARTNER_COMMERCIAL_TERMS_REQUIRED");
   if(!input.commercial.ruleVersion||input.commercial.ruleVersion==="UNRESOLVED")throw new Error("COMMISSION_RULE_NOT_CONFIGURED");
   const rules=await tx.query<{rate_bps:number}>("SELECT rate_bps FROM commission_rules WHERE version=$1 AND status='ACTIVE' AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now()) FOR SHARE",[input.commercial.ruleVersion]);
   const rule=rules[0];if(!rule)throw new Error("COMMISSION_RULE_NOT_CONFIGURED");
   const basis=BigInt(input.price.baseAmount);const commission=basis*BigInt(rule.rate_bps)/BigInt(10000);const partner=basis-commission;
   await tx.execute("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'COMMISSIONABLE')",[input.bookingId,input.partnerId]);
   await tx.execute("INSERT INTO partner_commission_ledger(id,partner_id,booking_id,commercial_path,status,currency,commission_basis_amount,commission_rate_bps,commission_amount,partner_amount,commission_rule_version,commercial_terms_version) VALUES(gen_random_uuid(),$1,$2,'COMMISSIONABLE','PENDING',$3,$4::bigint,$5,$6::bigint,$7::bigint,$8,$9)",[input.partnerId,input.bookingId,input.price.currency,input.price.baseAmount,rule.rate_bps,commission.toString(),partner.toString(),input.commercial.ruleVersion,input.commercial.acceptedTermsVersion]);
   await tx.execute("UPDATE price_snapshots SET commission_rule_version=$2,commission_amount=$3::bigint,partner_amount=$4::bigint WHERE booking_id=$1",[input.bookingId,input.commercial.ruleVersion,commission.toString(),partner.toString()]);
   return;
  }
  await tx.execute("INSERT INTO partner_booking_commercial_paths(booking_id,partner_id,path) VALUES($1,$2,'LAUNCH_FREE')",[input.bookingId,input.partnerId])
 }
 async attachInventoryToBooking(tx:TransactionContext,input:Parameters<BookingTransactionRepository["attachInventoryToBooking"]>[1]){await tx.execute("INSERT INTO inventory_holds(id,service_id,availability_id,booking_id,quantity,status,expires_at) SELECT gen_random_uuid(),service_id,$2,$1,$3,'ACTIVE',now()+($4::text || ' minutes')::interval FROM availability WHERE id=$2",[input.bookingId,input.availabilityId,input.quantity,input.holdMinutes])}
 async completeIdempotency(tx:TransactionContext,input:{userId:string;key:string;bookingId:string}){await tx.execute("UPDATE booking_idempotency SET booking_id=$3,status='COMPLETED' WHERE user_id=$1 AND idempotency_key=$2 AND status='PROCESSING'",[input.userId,input.key,input.bookingId])}
 async writeAudit(tx:TransactionContext,input:{actorUserId:string;action:string;targetType:string;targetId:string}){await tx.execute("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id) VALUES(gen_random_uuid(),$1,$2,$3,$4)",[input.actorUserId,input.action,input.targetType,input.targetId])}
}
