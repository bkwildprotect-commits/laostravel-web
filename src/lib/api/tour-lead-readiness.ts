const REQUIRED_ENV=["TOUR_LEAD_RATE_LIMIT_SECRET"] as const;
const MIN_SECRET_LENGTH=32;
export function getTourLeadReadiness(env:Record<string,string|undefined>=process.env){
 const missing=REQUIRED_ENV.filter(k=>!env[k]?.trim());
 const invalid:string[]=[];
 const secret=env.TOUR_LEAD_RATE_LIMIT_SECRET?.trim();
 if(secret&&secret.length<MIN_SECRET_LENGTH)invalid.push("TOUR_LEAD_RATE_LIMIT_SECRET");
 const approved=env.TOUR_LEAD_API_APPROVED==="true";
 return {ready:missing.length===0&&invalid.length===0&&approved,missing,invalid,approved} as const;
}
