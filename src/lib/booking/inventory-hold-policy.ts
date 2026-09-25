export type InventoryHoldPolicy={holdMinutes:number};
export function readInventoryHoldPolicy(env:Record<string,string|undefined>=process.env):InventoryHoldPolicy{
 const raw=env.BOOKING_HOLD_MINUTES;if(!raw)throw new Error("BOOKING_HOLD_POLICY_NOT_CONFIGURED");
 const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>1440)throw new Error("BOOKING_HOLD_POLICY_INVALID");
 return {holdMinutes:n};
}
