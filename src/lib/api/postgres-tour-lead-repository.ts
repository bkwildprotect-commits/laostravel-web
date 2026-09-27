import type {TourLeadInsertResult,TourLeadRecord,TourLeadRepository} from "./tour-lead-repository";
type Queryable={query<T=unknown>(text:string,values?:unknown[]):Promise<{rows:T[];rowCount:number|null}>};
type Existing={id:string;request_hash:string};
export class PostgresTourLeadRepository implements TourLeadRepository{
 constructor(private readonly db:Queryable){}
 async insertOrResolve(input:TourLeadRecord):Promise<TourLeadInsertResult>{
  const inserted=await this.db.query<{id:string}>(`INSERT INTO tour_leads(id,submission_key,request_hash,name,phone,email,requested_date,guests,consent)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
ON CONFLICT (submission_key) DO NOTHING
RETURNING id`,[input.id,input.submissionKey,input.requestHash,input.name,input.phone,input.email,input.requestedDate,input.guests,input.consent]);
  if(inserted.rows[0])return {kind:"CREATED",id:inserted.rows[0].id};
  const existing=await this.db.query<Existing>("SELECT id,request_hash FROM tour_leads WHERE submission_key=$1",[input.submissionKey]);
  const row=existing.rows[0];if(!row)throw new Error("TOUR_LEAD_IDEMPOTENCY_RACE");
  return row.request_hash===input.requestHash?{kind:"REPLAY",id:row.id}:{kind:"CONFLICT"};
 }
}
