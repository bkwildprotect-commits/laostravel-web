const REQUIRED_ENV=["TOUR_LEAD_RATE_LIMIT_SECRET"] as const;
export function getTourLeadReadiness(env:Record<string,string|undefined>=process.env){
 const missing=REQUIRED_ENV.filter(k=>!env[k]?.trim());
 const approved=env.TOUR_LEAD_API_APPROVED==="true";
 return {ready:missing.length===0&&approved,missing,approved} as const;
}
