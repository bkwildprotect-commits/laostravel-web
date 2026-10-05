import type {Pool} from "pg";
import {AuthenticationError} from "../auth/authentication";
import {displayCurrencies,type DisplayCurrency} from "../pricing/indicative-currency";

const allowed=new Set<string>(displayCurrencies);
export class DisplayCurrencyPreferenceError extends Error{
 constructor(readonly code:"INVALID_DISPLAY_CURRENCY"){super(code)}
}
export function parseDisplayCurrency(value:unknown):DisplayCurrency{
 if(typeof value!=="string"||!allowed.has(value))throw new DisplayCurrencyPreferenceError("INVALID_DISPLAY_CURRENCY");
 return value as DisplayCurrency;
}
/** Updates only the verified active user's own profile. LAK booking and settlement values are unchanged. */
export async function updateDisplayCurrencyPreference(pool:Pool,userId:string,value:unknown){
 const currency=parseDisplayCurrency(value);
 const result=await pool.query<{preferred_display_currency:string}>(
  `INSERT INTO user_profiles(user_id,preferred_display_currency)
   SELECT id,$2 FROM users WHERE id=$1 AND status='ACTIVE'
   ON CONFLICT(user_id) DO UPDATE
   SET preferred_display_currency=EXCLUDED.preferred_display_currency
   RETURNING preferred_display_currency`,[userId,currency]);
 if(!result.rows[0])throw new AuthenticationError("AUTH_INVALID");
 return {preferredDisplayCurrency:parseDisplayCurrency(result.rows[0].preferred_display_currency)};
}
