import {describe,it,expect} from "vitest";import {calculateCommission} from "../model";
describe("commission calculation",()=>{
 it("calculates using integer minor units and basis points",()=>expect(calculateCommission("LAK","100000",{version:"v-test",rateBps:1000})).toEqual({currency:"LAK",basisAmount:"100000",rateBps:1000,commissionAmount:"10000",partnerAmount:"90000",ruleVersion:"v-test"}));
 it("never hardcodes a business rate",()=>expect(calculateCommission("LAK","100000",{version:"category-rule",rateBps:0}).commissionAmount).toBe("0"));
 it("rejects invalid rates",()=>expect(()=>calculateCommission("LAK","100",{version:"bad",rateBps:10001})).toThrow());
 it("rejects non-integer money",()=>expect(()=>calculateCommission("LAK","10.50",{version:"bad-money",rateBps:1000})).toThrow());
});
