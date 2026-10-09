import type {TransactionContext} from "../infrastructure/transaction";
export class PartnerSellabilityError extends Error{readonly code="PARTNER_NO_BOOKABLE_SERVICE";constructor(){super("PARTNER_NO_BOOKABLE_SERVICE")}}
export async function assertPartnerReadyToSell(tx:TransactionContext,partnerId:string){
 const rows=await tx.query<{id:string}>(`SELECT s.id FROM services s
 JOIN service_area_assignments saa ON saa.service_id=s.id
 JOIN service_areas sa ON sa.code=saa.area_code
 JOIN availability a ON a.service_id=s.id
 JOIN service_price_offers po ON po.service_id=s.id
 WHERE s.partner_id=$1 AND s.status='ACTIVE' AND sa.commercial_status='BOOKING_ENABLED'
 AND a.starts_at>now() AND (a.remaining IS NULL OR a.remaining>0)
 AND po.status='ACTIVE' AND po.effective_from<=now() AND (po.effective_until IS NULL OR po.effective_until>now())
 AND (COALESCE(s.service_kind,'')<>'GUIDED_TRIP' OR (EXISTS(SELECT 1 FROM service_capability_details sc WHERE sc.service_id=s.id AND sc.publication_status='PUBLISHED') AND EXISTS(SELECT 1 FROM geo_locations g WHERE g.service_id=s.id AND g.kind='SERVICE_MEETING_POINT' AND g.verification_status='VERIFIED')))
 AND (COALESCE(s.service_kind,'')<>'INTERCITY_TRANSPORT' OR EXISTS(SELECT 1 FROM service_capability_details sc WHERE sc.service_id=s.id AND (sc.vehicle_type='VIP_VAN' OR (sc.vehicle_type='BUS' AND EXISTS(SELECT 1 FROM intercity_designated_stops ds WHERE ds.service_id=s.id AND ds.active=true AND ds.verification_status='VERIFIED' AND ds.stop_role IN ('BOARDING','BOTH'))))))
 FOR SHARE OF s,saa,sa,a,po`,[partnerId]);
 if(!rows.length)throw new PartnerSellabilityError();
}
