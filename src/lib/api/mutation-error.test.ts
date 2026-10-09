import {describe,it,expect} from "vitest";import {mapMutationError} from "./mutation-error";
describe("mutation API errors",()=>{
 it.each([["SERVICE_AREA_NOT_BOOKABLE",409],["PARTNER_COMMERCIAL_TERMS_REQUIRED",409],["TRANSACTION_RETRY_EXHAUSTED",503],["PRICE_QUOTE_ALREADY_CONSUMED",409]])("maps %s safely",(code,status)=>expect(mapMutationError(new Error(code as string))).toMatchObject({code,status}));
 it("does not expose SQL diagnostics or arbitrary errors",()=>expect(mapMutationError(new Error('password connection details'))).toBeNull());
});
