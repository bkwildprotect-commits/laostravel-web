import {readInventoryHoldPolicy} from "./inventory-hold-policy";
import {assertReservableInventory} from "./inventory-allocation";
import {assertInventoryReservation} from "./postgres-repository-contract";
import type {TransactionAdapter} from "../infrastructure/transaction";
import type {BookingTransactionRepository} from "./repository";
import {BookingTransactionError} from "./transaction-errors";
import {PostgresQuoteStore} from "../pricing/postgres-quote-store";
import {verifyBookingQuote} from "../pricing/quote-verification";
import type {CreateBookingRequest} from "../api/contracts";
export type AtomicBookingInput={userId:string;idempotencyKey:string;requestHash:string;bookingRequest:CreateBookingRequest};
export type AtomicBookingResult={bookingId:string;bookingRef:string;replayed:boolean};
export async function createBookingAtomically(txAdapter:TransactionAdapter,repo:BookingTransactionRepository,input:AtomicBookingInput):Promise<AtomicBookingResult>{
 const holdPolicy=readInventoryHoldPolicy();
 return txAdapter.run("SERIALIZABLE",async tx=>{
  const idem=await repo.claimIdempotency(tx,input.userId,input.idempotencyKey,input.requestHash);
  if(idem==="CONFLICT")throw new BookingTransactionError("IDEMPOTENCY_CONFLICT","Idempotency key was already used for a different request",409);
  if(idem==="IN_PROGRESS")throw new BookingTransactionError("REQUEST_IN_PROGRESS","An identical booking request is already processing",409);
  if(idem==="REPLAY"){const prior=await repo.getCompletedIdempotentBooking(tx,input.userId,input.idempotencyKey);if(!prior)throw new BookingTransactionError("REQUEST_IN_PROGRESS","Completed replay record is not yet readable",409);return {...prior,replayed:true};}
  const verified=await verifyBookingQuote(new PostgresQuoteStore(tx),input.bookingRequest);
  if(verified.quote.serviceId!==input.bookingRequest.serviceId||verified.quote.quantity!==input.bookingRequest.quantity)throw new BookingTransactionError("PRICE_QUOTE_MISMATCH","Authoritative quote does not match booking input",409);
  const availabilityId=verified.quote.availabilityId;const serviceId=verified.quote.serviceId;const quantity=verified.quote.quantity;
  const ownership=await repo.resolveBookingOwnership(tx,{serviceId,availabilityId});const partnerId=ownership.partnerId;
  const inventory=await repo.lockAvailability(tx,availabilityId);
  assertReservableInventory(inventory,quantity);
  assertInventoryReservation(await repo.reserveInventory(tx,availabilityId,quantity));
  await repo.lockPartnerTrial(tx,partnerId);
  const commercial=await repo.allocateCommercialPath(tx,{partnerId:partnerId});
  const booking=await repo.createBooking(tx,{userId:input.userId,partnerId:partnerId,serviceId:serviceId,availabilityId:availabilityId,quantity:quantity,commercial,price:verified.price});
  await repo.consumePriceQuote(tx,{priceQuoteId:verified.price.priceQuoteId,bookingId:booking.bookingId});
  await repo.persistCommercialPath(tx,{bookingId:booking.bookingId,partnerId:partnerId,commercial});
  await repo.attachInventoryToBooking(tx,{bookingId:booking.bookingId,availabilityId:availabilityId,quantity:quantity,holdMinutes:holdPolicy.holdMinutes});
  await repo.writeAudit(tx,{actorUserId:input.userId,action:"BOOKING_CREATED",targetType:"booking",targetId:booking.bookingId});
  await repo.completeIdempotency(tx,{userId:input.userId,key:input.idempotencyKey,bookingId:booking.bookingId});
  return {...booking,replayed:false};
 });
}
