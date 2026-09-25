import {readInventoryHoldPolicy} from "./inventory-hold-policy";
import {assertReservableInventory} from "./inventory-allocation";
import {assertInventoryReservation} from "./postgres-repository-contract";
import type {TransactionAdapter} from "@/lib/infrastructure/transaction";
import type {BookingTransactionRepository} from "./repository";
import {BookingTransactionError} from "./transaction-errors";
import {PostgresQuoteStore} from "@/lib/pricing/postgres-quote-store";
import {verifyBookingQuote} from "@/lib/pricing/quote-verification";
import type {CreateBookingRequest} from "@/lib/api/contracts";
export type AtomicBookingInput={userId:string;partnerId:string;serviceId:string;availabilityId:string;quantity:number;idempotencyKey:string;requestHash:string;bookingRequest:CreateBookingRequest};
export type AtomicBookingResult={bookingId:string;bookingRef:string;replayed:boolean};
export async function createBookingAtomically(txAdapter:TransactionAdapter,repo:BookingTransactionRepository,input:AtomicBookingInput):Promise<AtomicBookingResult>{
 const holdPolicy=readInventoryHoldPolicy();
 return txAdapter.run("SERIALIZABLE",async tx=>{
  const idem=await repo.claimIdempotency(tx,input.userId,input.idempotencyKey,input.requestHash);
  if(idem==="CONFLICT")throw new BookingTransactionError("IDEMPOTENCY_CONFLICT","Idempotency key was already used for a different request",409);
  if(idem==="IN_PROGRESS")throw new BookingTransactionError("REQUEST_IN_PROGRESS","An identical booking request is already processing",409);
  if(idem==="REPLAY"){const prior=await repo.getCompletedIdempotentBooking(tx,input.userId,input.idempotencyKey);if(!prior)throw new BookingTransactionError("REQUEST_IN_PROGRESS","Completed replay record is not yet readable",409);return {...prior,replayed:true};}
  const verified=await verifyBookingQuote(new PostgresQuoteStore(tx),input.bookingRequest);
  if(verified.quote.serviceId!==input.serviceId||verified.quote.availabilityId!==input.availabilityId||verified.quote.quantity!==input.quantity)throw new BookingTransactionError("PRICE_QUOTE_MISMATCH","Authoritative quote does not match booking input",409);
  const inventory=await repo.lockAvailability(tx,input.availabilityId);
  assertReservableInventory(inventory,input.quantity);
  assertInventoryReservation(await repo.reserveInventory(tx,input.availabilityId,input.quantity));
  await repo.lockPartnerTrial(tx,input.partnerId);
  const commercial=await repo.allocateCommercialPath(tx,{partnerId:input.partnerId});
  const booking=await repo.createBooking(tx,{userId:input.userId,partnerId:input.partnerId,serviceId:input.serviceId,availabilityId:input.availabilityId,quantity:input.quantity,commercial,price:verified.price});
  await repo.persistCommercialPath(tx,{bookingId:booking.bookingId,partnerId:input.partnerId,commercial});
  await repo.attachInventoryToBooking(tx,{bookingId:booking.bookingId,availabilityId:input.availabilityId,quantity:input.quantity,holdMinutes:holdPolicy.holdMinutes});
  await repo.writeAudit(tx,{actorUserId:input.userId,action:"BOOKING_CREATED",targetType:"booking",targetId:booking.bookingId});
  await repo.completeIdempotency(tx,{userId:input.userId,key:input.idempotencyKey,bookingId:booking.bookingId});
  return {...booking,replayed:false};
 });
}
