type Queryable={query<T=unknown>(text:string,values?:readonly unknown[]):Promise<{rows:T[];rowCount:number|null}>};
export type RateLimitDecision={allowed:boolean;count:number;limit:number;windowStartedAt:Date};
export class PostgresTourLeadRateLimit{
 constructor(private readonly db:Queryable,private readonly limit=5,private readonly windowSeconds=900){}
 async consume(rateKey:string,now=new Date()):Promise<RateLimitDecision>{
  const windowMs=this.windowSeconds*1000;const start=new Date(Math.floor(now.getTime()/windowMs)*windowMs);
  const result=await this.db.query<{request_count:number}>(`INSERT INTO tour_lead_rate_limits(rate_key,window_started_at,request_count)
VALUES($1,$2,1)
ON CONFLICT (rate_key,window_started_at) DO UPDATE
SET request_count=tour_lead_rate_limits.request_count+1,updated_at=NOW()
RETURNING request_count`,[rateKey,start]);
  const count=result.rows[0]?.request_count;if(!count)throw new Error("TOUR_LEAD_RATE_LIMIT_WRITE_FAILED");
  return {allowed:count<=this.limit,count,limit:this.limit,windowStartedAt:start};
 }
}
