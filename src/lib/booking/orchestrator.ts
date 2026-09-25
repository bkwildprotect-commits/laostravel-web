import {assertReservableInventory} from "./inventory-allocation";
import type {TransactionAdapter} from "@/lib/infrastructure/transaction";
import type {BookingTransactionRepository} from "./repository";
import {BookingTransactionError} from "./transaction-errors";

export type AtomicBookingInput={userId:string;partnerId:string;serviceId:string;availabilityId:string;quantity:number;idempotencyKey:string;requestHash:string};
export type AtomicBookingResult={bookingId:string;bookingRef:string;replayed:boolean};

export async function createBookingAtomically(
 txAdapter:TransactionAdapter,repo:BookingTransactionRepository,input:AtomicBookingInput
):Promise<AtomicBookingResult>{
 return txAdapter.run("SERIALIZABLE",async tx=>{
  const idem=await repo.claimIdempotency(tx,input.userId,input.idempotencyKey,input.requestHash);
  if(idem==="CONFLICT")throw new BookingTransactionError("IDEMPOTENCY_CONFLICT","Idempotency key was already used for a different request",409);
  if(idem==="IN_PROGRESS")throw new BookingTransactionError("REQUEST_IN_PROGRESS","An identical booking request is already processing",409);
  if(idem==="REPLAY")throw new BookingTransactionError("REQUEST_IN_PROGRESS","Replay lookup requires the concrete PostgreSQL repository",409);
  const inventory=await repo.lockAvailability(tx,input.availabilityId);
  assertReservableInventory(inventory,input.quantity);
  await repo.reserveInventory(tx,input.availabilityId,input.quantity);
  await repo.lockPartnerTrial(tx,input.partnerId);
  const booking=await repo.createBooking(tx,{userId:input.userId,serviceId:input.serviceId,quantity:input.quantity});
  await repo.writeAudit(tx,{actorUserId:input.userId,action:"BOOKING_CREATED",targetType:"booking",targetId:booking.bookingId});
  return {...booking,replayed:false};
 });
}
