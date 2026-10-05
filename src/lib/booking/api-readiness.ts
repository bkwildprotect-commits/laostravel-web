import {getCoreRuntimeConfigurationIssues} from "../infrastructure/production-readiness";

export type BookingApiReadiness={ready:true}|{ready:false;missing:string[]};

export function getBookingApiReadiness(env:Record<string,string|undefined>=process.env):BookingApiReadiness{
 const missing=getCoreRuntimeConfigurationIssues(env);
 // Production booking remains closed until the quote/auth/PostgreSQL path is
 // explicitly approved after integration verification.
 if(env.BOOKING_API_APPROVED!=="true")missing.push("BOOKING_API_APPROVED");
 return missing.length?{ready:false,missing}:{ready:true};
}
