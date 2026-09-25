import type {AvailabilityQuote,MoneyAmount} from "@/lib/api/contracts";
export type PriceSnapshot={currency:string;baseAmount:MoneyAmount;feesAmount:MoneyAmount;couponAmount:MoneyAmount;pointsBenefitAmount:MoneyAmount;customerTotal:MoneyAmount;priceQuoteId:string};
function minor(v:MoneyAmount){if(!/^\d+$/.test(v))throw new Error("Money must be a non-negative integer string");return BigInt(v)}
export function createPriceSnapshot(q:AvailabilityQuote):PriceSnapshot{
 const base=minor(q.baseAmount),fees=minor(q.feesAmount),coupon=minor(q.couponAmount),points=minor(q.pointsBenefitAmount),total=minor(q.customerTotal);
 const expected=base+fees-coupon-points;if(expected<0n||total!==expected)throw new Error("Invalid authoritative price quote");
 if(!/^[A-Z]{3}$/.test(q.currency))throw new Error("Invalid currency");
 return {currency:q.currency,baseAmount:q.baseAmount,feesAmount:q.feesAmount,couponAmount:q.couponAmount,pointsBenefitAmount:q.pointsBenefitAmount,customerTotal:q.customerTotal,priceQuoteId:q.priceQuoteId};
}
