import {describe,it,expect,vi} from "vitest";
import {updateDisplayCurrencyPreference} from "./postgres-display-currency";

describe("display currency preference store",()=>{
 it("rejects unsupported values before querying",async()=>{
  const query=vi.fn();
  await expect(updateDisplayCurrencyPreference({query} as never,"u1","BTC")).rejects.toMatchObject({code:"INVALID_DISPLAY_CURRENCY"});
  await expect(updateDisplayCurrencyPreference({query} as never,"u1",null)).rejects.toMatchObject({code:"INVALID_DISPLAY_CURRENCY"});
  expect(query).not.toHaveBeenCalled();
 });
 it("upserts only the verified active user's own preference",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[{preferred_display_currency:"JPY"}]});
  await expect(updateDisplayCurrencyPreference({query} as never,"mapped-user","JPY"))
   .resolves.toEqual({preferredDisplayCurrency:"JPY"});
  expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE id=$1 AND status='ACTIVE'"),["mapped-user","JPY"]);
  expect(query.mock.calls[0][0]).toContain("ON CONFLICT(user_id)");
 });
 it("fails closed when the authenticated user is not active or mapped",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[]});
  await expect(updateDisplayCurrencyPreference({query} as never,"missing","LAK"))
   .rejects.toMatchObject({code:"AUTH_INVALID"});
 });
 it("fails closed if the database returns an invalid currency",async()=>{
  const query=vi.fn().mockResolvedValue({rows:[{preferred_display_currency:"BTC"}]});
  await expect(updateDisplayCurrencyPreference({query} as never,"u1","LAK"))
   .rejects.toMatchObject({code:"INVALID_DISPLAY_CURRENCY"});
 });
});
