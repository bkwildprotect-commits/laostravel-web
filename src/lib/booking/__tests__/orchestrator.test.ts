import {describe,it,expect,vi} from "vitest";import {createBookingAtomically} from "../orchestrator";
const tx={query:vi.fn(),execute:vi.fn()};
const adapter={run:async(_iso:"SERIALIZABLE",work:(t:typeof tx)=>Promise<unknown>)=>work(tx)};
function repo(idem:"CLAIMED"|"REPLAY"|"CONFLICT"|"IN_PROGRESS"="CLAIMED"){return{
 claimIdempotency:vi.fn().mockResolvedValue(idem),lockAvailability:vi.fn(),reserveInventory:vi.fn().mockResolvedValue("hold-1"),
 lockPartnerTrial:vi.fn(),createBooking:vi.fn().mockResolvedValue({bookingId:"b1",bookingRef:"LT-1"}),writeAudit:vi.fn()
}}
const input={userId:"u1",partnerId:"p1",serviceId:"s1",availabilityId:"a1",quantity:1,idempotencyKey:"idem-123456",requestHash:"hash"};
describe("atomic booking orchestrator",()=>{
 it("runs critical operations in one transaction",async()=>{const r=repo();await expect(createBookingAtomically(adapter,r,input)).resolves.toEqual({bookingId:"b1",bookingRef:"LT-1",replayed:false});expect(r.lockAvailability).toHaveBeenCalled();expect(r.reserveInventory).toHaveBeenCalled();expect(r.lockPartnerTrial).toHaveBeenCalled();expect(r.writeAudit).toHaveBeenCalled()});
 it("stops on idempotency conflict before inventory mutation",async()=>{const r=repo("CONFLICT");await expect(createBookingAtomically(adapter,r,input)).rejects.toMatchObject({code:"IDEMPOTENCY_CONFLICT"});expect(r.reserveInventory).not.toHaveBeenCalled()});
 it("stops concurrent duplicate before inventory mutation",async()=>{const r=repo("IN_PROGRESS");await expect(createBookingAtomically(adapter,r,input)).rejects.toMatchObject({code:"REQUEST_IN_PROGRESS"});expect(r.reserveInventory).not.toHaveBeenCalled()});
});
