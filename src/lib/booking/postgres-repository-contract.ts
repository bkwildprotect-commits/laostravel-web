export type LockedAvailability={id:string;serviceId:string;remaining:number|null;version:number};
export type InventoryReservation={remaining:number|null;version:number};
/**
 * Contract for the concrete PostgreSQL adapter. Implementations must call these
 * methods inside the same SERIALIZABLE transaction used to create the booking.
 */
export interface PostgresBookingRepositoryContract{
 lockAvailability(availabilityId:string):Promise<LockedAvailability|null>;
 reserveFiniteInventory(availabilityId:string,quantity:number):Promise<InventoryReservation|null>;
}
export function assertInventoryReservation(result:InventoryReservation|null):InventoryReservation{
 if(!result)throw new Error("INSUFFICIENT_INVENTORY");
 if(result.remaining!==null&&result.remaining<0)throw new Error("INVENTORY_INVARIANT_VIOLATION");
 return result;
}
