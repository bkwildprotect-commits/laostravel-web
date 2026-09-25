import type {MoneyAmount} from "@/lib/api/contracts";
export type CommissionRule={version:string;rateBps:number};
export type CommissionSnapshot={currency:string;basisAmount:MoneyAmount;rateBps:number;commissionAmount:MoneyAmount;partnerAmount:MoneyAmount;ruleVersion:string};
function toMinor(value:MoneyAmount){if(!/^\d+$/.test(value))throw new Error("Money must be a non-negative integer string");return BigInt(value)}
export function calculateCommission(currency:string,basisAmount:MoneyAmount,rule:CommissionRule):CommissionSnapshot{
 if(!Number.isInteger(rule.rateBps)||rule.rateBps<0||rule.rateBps>10000)throw new Error("Invalid commission rate");
 const basis=toMinor(basisAmount);const commission=(basis*BigInt(rule.rateBps))/BigInt(10000);const partner=basis-commission;
 return {currency,basisAmount,rateBps:rule.rateBps,commissionAmount:commission.toString(),partnerAmount:partner.toString(),ruleVersion:rule.version};
}
