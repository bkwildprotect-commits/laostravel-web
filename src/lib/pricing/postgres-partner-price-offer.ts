import {randomUUID} from "node:crypto";import type {Pool} from "pg";
export class PriceOfferAccessDeniedError extends Error{}export class PriceOfferValidationError extends Error{}
export async function replaceActiveServicePriceOffer(pool:Pool,input:{userId:string;partnerId:string;serviceId:string;optionId?:string;unitAmount:string;partnerDiscountAmount:string}){
 if(!/^\d+$/.test(input.unitAmount)||!/^\d+$/.test(input.partnerDiscountAmount))throw new PriceOfferValidationError();
 const unit=BigInt(input.unitAmount),discount=BigInt(input.partnerDiscountAmount);if(discount>unit)throw new PriceOfferValidationError();
 const client=await pool.connect();try{await client.query("BEGIN");
  const allowed=await client.query<{allowed:boolean}>("SELECT EXISTS(SELECT 1 FROM partner_members pm JOIN services s ON s.partner_id=pm.partner_id WHERE pm.partner_id=$1 AND pm.user_id=$2 AND s.id=$3) AS allowed",[input.partnerId,input.userId,input.serviceId]);if(!allowed.rows[0]?.allowed)throw new PriceOfferAccessDeniedError();
  await client.query("UPDATE service_price_offers SET status='RETIRED',effective_until=COALESCE(effective_until,now()) WHERE service_id=$1 AND status='ACTIVE' AND (($2::text IS NULL AND option_id IS NULL) OR option_id=$2)",[input.serviceId,input.optionId??null]);
  const id=randomUUID();await client.query("INSERT INTO service_price_offers(id,service_id,option_id,currency,unit_amount,partner_discount_amount,status,effective_from) VALUES($1,$2,$3,'LAK',$4::bigint,$5::bigint,'ACTIVE',now())",[id,input.serviceId,input.optionId??null,input.unitAmount,input.partnerDiscountAmount]);
  await client.query("INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,'SERVICE_PRICE_OFFER_ACTIVATED','service',$3,$4::jsonb)",[randomUUID(),input.userId,input.serviceId,JSON.stringify({partnerId:input.partnerId,offerId:id,currency:"LAK",unitAmount:input.unitAmount,partnerDiscountAmount:input.partnerDiscountAmount,optionId:input.optionId??null})]);
  await client.query("COMMIT");return {id,serviceId:input.serviceId,currency:"LAK" as const,unitAmount:input.unitAmount,partnerDiscountAmount:input.partnerDiscountAmount,status:"ACTIVE" as const};
 }catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}
}