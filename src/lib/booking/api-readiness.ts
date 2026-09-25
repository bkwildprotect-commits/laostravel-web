export type BookingApiReadiness={ready:true}|{ready:false;missing:string[]};
export function getBookingApiReadiness(env:Record<string,string|undefined>=process.env):BookingApiReadiness{
 const required=["DATABASE_URL","BOOKING_HOLD_MINUTES","AUTH_ISSUER_URL","AUTH_AUDIENCE"] as const;
 const missing:string[]=required.filter(k=>!env[k]?.trim());
 // Even with environment variables present, production booking remains closed until
 // quote verification/auth adapters and PostgreSQL integration CI are explicitly approved.
 if(env.BOOKING_API_APPROVED!=="true")missing.push("BOOKING_API_APPROVED");
 return missing.length?{ready:false,missing}:{ready:true};
}
