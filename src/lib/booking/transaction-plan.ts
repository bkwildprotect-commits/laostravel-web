import type {CommissionEligibility} from "@/lib/commission/trial";
export type BookingTransactionInput={userId:string;partnerId:string;serviceId:string;availabilityId:string;quantity:number;idempotencyKey:string;requestHash:string;availabilityToken:string;priceQuoteId:string};
export type BookingTransactionPlan={
 steps:readonly string[];
 rollback:readonly string[];
};
export function buildBookingTransactionPlan(eligibility:CommissionEligibility):BookingTransactionPlan{
 const trial=eligibility.kind==="TRIAL_FREE"?"reserve_partner_trial_ordinal":"create_pending_commission_snapshot";
 return {
  steps:["begin_serializable_transaction","claim_idempotency_key","lock_service_and_availability","revalidate_quote_and_inventory","create_inventory_hold",trial,"create_booking_and_items","attach_hold_to_booking","write_audit_event","complete_idempotency_record","commit_transaction"],
  rollback:["rollback_transaction","release_uncommitted_inventory","do_not_consume_trial","do_not_earn_commission"]
 } as const;
}
