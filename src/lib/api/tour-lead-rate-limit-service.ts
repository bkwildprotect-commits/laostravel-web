import {deriveRateLimitKey} from "./rate-limit-key";
export type RateLimiter={consume(rateKey:string):Promise<{allowed:boolean}>};
export async function enforceTourLeadRateLimit(limiter:RateLimiter,input:{identifier:string;secret:string}){const rateKey=await deriveRateLimitKey({namespace:"tour-lead",identifier:input.identifier,secret:input.secret});const decision=await limiter.consume(rateKey);return {allowed:decision.allowed,rateKey}}
