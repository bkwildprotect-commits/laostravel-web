import type {PgPoolLike} from "../infrastructure/postgres-transaction";
import {PostgresTransactionAdapter} from "../infrastructure/postgres-transaction";
import {mutateBookingLifecycle} from "../booking/postgres-lifecycle";
import type {BookingEvent} from "../booking/lifecycle";

export class PartnerBookingMutationAccessDeniedError extends Error{constructor(){super("PARTNER_BOOKING_MUTATION_ACCESS_DENIED")}}

export async function mutatePartnerBookingLifecycle(pool:PgPoolLike,input:{userId:string;partnerId:string;bookingId:string;event:BookingEvent}){
 const adapter=new PostgresTransactionAdapter(pool);
 return adapter.run("SERIALIZABLE",async tx=>{
  const access=await tx.query<{allowed:boolean}>(`SELECT EXISTS(
   SELECT 1 FROM partner_members pm
   JOIN partner_booking_commercial_paths pc ON pc.partner_id=pm.partner_id
   WHERE pm.partner_id=$1 AND pm.user_id=$2 AND pc.booking_id=$3
  ) AS allowed`,[input.partnerId,input.userId,input.bookingId]);
  if(!access[0]?.allowed)throw new PartnerBookingMutationAccessDeniedError();
  return mutateBookingLifecycle(tx,{bookingId:input.bookingId,event:input.event,actorUserId:input.userId});
 });
}
