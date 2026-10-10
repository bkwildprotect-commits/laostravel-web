import type {AvailabilityQuote, CreateBookingRequest, IntercityDeparture} from "../api/contracts";
import {sharedContractVersion, launchPolicy, authority, bookingStatuses, paymentStatuses} from "../shared/cross-platform-contract";

export class ClientError extends Error { constructor(public code:string){super(code)} }
type Fetcher = typeof fetch;
function record(value:unknown):Record<string,unknown>{
 if(!value || typeof value!=="object" || Array.isArray(value))throw new ClientError("INVALID_RESPONSE");
 return value as Record<string,unknown>;
}
function text(value:unknown):string {if(typeof value!=="string"||!value.trim())throw new ClientError("INVALID_RESPONSE");return value}
function money(value:unknown):string {const s=text(value);if(!/^\d+$/.test(s))throw new ClientError("INVALID_RESPONSE");return s}
export function validateSharedContract(value:unknown){
 const v=record(value), p=record(v.launchPolicy), a=record(v.authority);
 if(v.version!==sharedContractVersion || JSON.stringify(v.bookingStatuses)!==JSON.stringify(bookingStatuses) || JSON.stringify(v.paymentStatuses)!==JSON.stringify(paymentStatuses)
  || Object.entries(launchPolicy).some(([k,x])=>p[k]!==x) || Object.entries(authority).some(([k,x])=>a[k]!==x))throw new ClientError("CONTRACT_MISMATCH");
}
export function validateQuote(value:unknown,selection:{serviceId:string;availabilityId:string;date:string;quantity:number}):AvailabilityQuote {
 const v=record(value);
 if(Object.entries(selection).some(([k,x])=>v[k]!==x)||v.currency!=="LAK")throw new ClientError("INVALID_RESPONSE");
 for(const key of ["baseAmount","feesAmount","partnerDiscountAmount","couponAmount","pointsBenefitAmount","customerTotal"])money(v[key]);
 text(v.priceQuoteId);text(v.availabilityToken);
 if(!Number.isFinite(Date.parse(text(v.expiresAt)))||Date.parse(v.expiresAt as string)<=Date.now())throw new ClientError("QUOTE_EXPIRED");
 return v as unknown as AvailabilityQuote;
}
export type WebSession={userId:string;email:string;displayName:string;partners:{partnerId:string;name:string;canManage:boolean;verificationStatus:string;businessStatus:string}[];applicationStatus:string|null};
function validateSession(value:unknown):WebSession{
 const v=record(value);text(v.userId);text(v.email);
 if(typeof v.displayName!=="string"||!Array.isArray(v.partners)||!(v.applicationStatus===null||["SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES","APPROVED","REJECTED"].includes(String(v.applicationStatus))))throw new ClientError("INVALID_RESPONSE");
 for(const raw of v.partners){const p=record(raw);text(p.partnerId);text(p.name);
  if(!["PENDING","APPROVED","REJECTED","SUSPENDED"].includes(String(p.verificationStatus))||!["DRAFT","ACTIVE","PAUSED","SUSPENDED","ARCHIVED"].includes(String(p.businessStatus))||p.canManage!==(p.verificationStatus==="APPROVED"&&p.businessStatus==="ACTIVE"))throw new ClientError("INVALID_RESPONSE");
 }
 return v as unknown as WebSession;
}
export function publicAuthConfiguration(url:string,key:string){
 let origin:URL;try{origin=new URL(url)}catch{throw new ClientError("CONFIGURATION_REQUIRED")}
 if(origin.protocol!=="https:"||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=="/")throw new ClientError("CONFIGURATION_REQUIRED");
 let allowed=/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
 if(!allowed)try{const parts=key.split(".");allowed=parts.length===3&&JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/"))).role==="anon"}catch{}
 if(!allowed)throw new ClientError("CONFIGURATION_REQUIRED");
 return {origin:origin.origin,key};
}

/** Memory-only session. Backend JWT verification and identity mapping grant access. */
export class ConnectedBackend {
 private token?:string;private refreshToken?:string;private expires=0;private generation=0;
 private refreshing?:Promise<string>;private contract?:Promise<void>;
 constructor(private config:{url:string;key:string},private send:Fetcher=fetch){}
 clear(){this.generation++;this.token=undefined;this.refreshToken=undefined;this.expires=0;this.refreshing=undefined}
 private async response(url:string,init:RequestInit):Promise<unknown>{
  try{const r=await this.send(url,{...init,cache:"no-store",credentials:"omit",redirect:"error",signal:AbortSignal.timeout(20000)});
   let v:unknown;try{v=await r.json()}catch{throw new ClientError("INVALID_RESPONSE")}
   if(!r.ok)throw new ClientError(r.status===401?"AUTH_REQUIRED":r.status===429?"RATE_LIMITED":String(record(v).error&&record(record(v).error).code||"SERVICE_UNAVAILABLE"));
   return v;
  }catch(e){if(e instanceof ClientError)throw e;throw new ClientError("NETWORK_ERROR")}
 }
 private async provider(path:string,body:unknown){const c=publicAuthConfiguration(this.config.url,this.config.key);
  return record(await this.response(c.origin+"/auth/v1/"+path,{method:"POST",headers:{apikey:c.key,"Content-Type":"application/json"},body:JSON.stringify(body)}));
 }
 private accept(v:Record<string,unknown>){const access=text(v.access_token), refresh=text(v.refresh_token);
  if(v.token_type!=="bearer"||typeof v.expires_in!=="number"||!Number.isSafeInteger(v.expires_in)||v.expires_in<=0)throw new ClientError("INVALID_RESPONSE");
  this.token=access;this.refreshToken=refresh;this.expires=Date.now()+v.expires_in*1000;
 }
 private async access():Promise<string>{
  if(!this.token)throw new ClientError("AUTH_REQUIRED");if(this.expires>Date.now()+30000)return this.token;
  const generation=this.generation;
  if(!this.refreshing){const pending=this.provider("token?grant_type=refresh_token",{refresh_token:this.refreshToken}).then(v=>{
   if(generation!==this.generation)throw new ClientError("AUTH_REQUIRED");this.accept(v);return this.token!;
  }).catch(e=>{if(generation===this.generation)this.clear();throw e}).finally(()=>{if(this.refreshing===pending)this.refreshing=undefined});this.refreshing=pending;}
  return this.refreshing;
 }
 async request(path:string,body?:unknown,authenticated=false,method?:string):Promise<unknown>{
  if(!/^\/api\/v1\/[a-zA-Z0-9/?=&%._-]+$/.test(path))throw new ClientError("INVALID_REQUEST");
  const headers:Record<string,string>={Accept:"application/json","Content-Type":"application/json"};
  const generation=this.generation;
  if(authenticated)headers.Authorization="Bearer "+await this.access();
  if(authenticated&&generation!==this.generation)throw new ClientError("AUTH_REQUIRED");
  try{const v=record(await this.response(path,{method:method??(body===undefined?"GET":"POST"),headers,...(body===undefined?{}:{body:JSON.stringify(body)})}));
   if(authenticated&&generation!==this.generation)throw new ClientError("AUTH_REQUIRED");
   if(v.error!==null||v.data===null||v.data===undefined)throw new ClientError("INVALID_RESPONSE");return v.data;
  }catch(e){if(authenticated&&generation===this.generation&&e instanceof ClientError&&e.code==="AUTH_REQUIRED")this.clear();throw e}
 }
 async sharedContract(){
  if(!this.contract)this.contract=this.request("/api/v1/meta/shared-contract").then(validateSharedContract).catch(e=>{this.contract=undefined;throw e});
  return this.contract;
 }
 async session(){return validateSession(await this.request("/api/v1/auth/session",undefined,true))}
 async authenticate(mode:"login"|"register"|"forgot",input:{email:string;password?:string;name?:string}){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)||mode!=="forgot"&&(!input.password||input.password.length<8))throw new ClientError("INVALID_INPUT");
  if(mode==="forgot"){await this.provider("recover",{email:input.email});return null}
  this.clear();const generation=this.generation;
  const v=await this.provider(mode==="login"?"token?grant_type=password":"signup",{email:input.email,password:input.password,...(mode==="register"?{data:{display_name:input.name??""}}:{})});
  if(generation!==this.generation)throw new ClientError("AUTH_REQUIRED");
  if(mode==="register"&&!v.access_token){text(v.id);return null}
  try{this.accept(v);await this.sharedContract();return await this.session()}catch(e){if(generation===this.generation)this.clear();throw e}
 }
 async departures(date:string,locale="en"):Promise<IntercityDeparture[]>{
  const v=record(await this.request("/api/v1/intercity/departures?date="+encodeURIComponent(date)+"&locale="+(["en","lo","th"].includes(locale)?locale:"en")));
  if(!Array.isArray(v.departures))throw new ClientError("INVALID_RESPONSE");
  for(const raw of v.departures){const d=record(raw);for(const k of ["serviceId","availabilityId","partnerName","serviceName","departureAt"])text(d[k]);
   const p=record(d.pricing);if(p.currency!=="LAK"||!Number.isSafeInteger(d.remainingSeats)||Number(d.remainingSeats)<=0||!["BUS","VIP_VAN"].includes(String(d.vehicleType))||!Number.isFinite(Date.parse(d.departureAt as string))||!Array.isArray(d.designatedStops))throw new ClientError("INVALID_RESPONSE");
   money(p.unitAmount);money(p.partnerDiscountAmount);money(p.customerUnitTotal);text(record(d.origin).name);text(record(d.destination).name);
   const stops=d.designatedStops.map(record);if(d.vehicleType==="BUS"&&!stops.some(s=>s.role==="BOARDING"||s.role==="BOTH"))throw new ClientError("INVALID_RESPONSE");
   for(const s of stops){text(s.id);text(s.name);if(!["BOARDING","DROPOFF","BOTH"].includes(String(s.role)))throw new ClientError("INVALID_RESPONSE")}
  }
  return v.departures as IntercityDeparture[];
 }
 async quote(selection:{serviceId:string;availabilityId:string;date:string;quantity:number}){await this.sharedContract();return validateQuote(await this.request("/api/v1/availability/quote",selection),selection)}
 async book(input:CreateBookingRequest){await this.sharedContract();const v=record(await this.request("/api/v1/bookings",input,true));text(v.bookingId);text(v.bookingRef);if(typeof v.replayed!=="boolean")throw new ClientError("INVALID_RESPONSE");return v as {bookingId:string;bookingRef:string;replayed:boolean}}
 async apply(input:Record<string,string>){await this.sharedContract();const v=record(await this.request("/api/v1/partner-applications",input,true));text(v.applicationId);if(v.status!=="SUBMITTED")throw new ClientError("INVALID_RESPONSE");return v as {applicationId:string;status:"SUBMITTED"}}
}
export const connectedBackend = new ConnectedBackend({url:process.env.NEXT_PUBLIC_SUPABASE_URL??"",key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??""});

/** Freeze exactly one attempt. An uncertain result must reuse the same owner/body/key. */
export class BookingAttempt {
 private pending?:Promise<{bookingId:string;bookingRef:string;replayed:boolean}>;
 private result?:{bookingId:string;bookingRef:string;replayed:boolean};
 private body:string;
 constructor(private owner:string,input:CreateBookingRequest){this.body=JSON.stringify(input)}
 async submit(api:ConnectedBackend){if(this.pending)return this.pending;
  this.pending=(async()=>{if((await api.session()).userId!==this.owner)throw new ClientError("ACCOUNT_CHANGED");
   if(this.result)return this.result;this.result=await api.book(JSON.parse(this.body));return this.result;
  })().finally(()=>{this.pending=undefined});return this.pending;
 }
}
