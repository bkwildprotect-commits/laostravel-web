import {describe,it,expect,vi} from "vitest";
import {BookingAttempt,ConnectedBackend,publicAuthConfiguration,validateQuote,validateSharedContract} from "./connected-backend";
import {getSharedContract,authority} from "../shared/cross-platform-contract";
const config={url:"https://auth.example",key:"sb_publishable_test"};
const profile={userId:"mapped-user",email:"u@example.com",displayName:"User",partners:[],applicationStatus:null};
const tokens={access_token:"verified-token",refresh_token:"refresh",expires_in:3600,token_type:"bearer"};
const envelope=(data:unknown)=>new Response(JSON.stringify({data,error:null}),{status:200});
const selection={serviceId:"s",availabilityId:"a",date:"2099-01-01",quantity:1};
const quote={...selection,currency:"LAK",customerTotal:"100",baseAmount:"100",feesAmount:"0",partnerDiscountAmount:"0",couponAmount:"0",pointsBenefitAmount:"0",priceQuoteId:"q",availabilityToken:"t",expiresAt:"2099-01-01T12:00:00Z"};
describe("connected Website security and contract",()=>{
 it.each(["http://auth.example","https://user:password@auth.example","https://auth.example/path"])("rejects unsafe provider %s",url=>expect(()=>publicAuthConfiguration(url,config.key)).toThrow());
 it("rejects secret and service-role keys",()=>{
  expect(()=>publicAuthConfiguration(config.url,"sb_secret_private")).toThrow();
  const token="x."+btoa(JSON.stringify({role:"service_role"}))+".x";expect(()=>publicAuthConfiguration(config.url,token)).toThrow();
 });
 it("passes only provider credentials, then verifies server identity before login success",async()=>{
  const send=vi.fn<typeof fetch>(async(url,init)=>{expect(init?.redirect).toBe("error");expect(init?.credentials).toBe("omit");
   if(String(url).includes("auth.example")){expect(JSON.parse(init!.body as string)).toEqual({email:"u@example.com",password:"password123"});return new Response(JSON.stringify(tokens));}
   if(String(url).endsWith("shared-contract"))return envelope(getSharedContract());
   expect((init?.headers as Record<string,string>).Authorization).toBe("Bearer verified-token");return envelope(profile);
  });
  const api=new ConnectedBackend(config,send);expect(await api.authenticate("login",{email:"u@example.com",password:"password123"})).toEqual(profile);expect(send).toHaveBeenCalledTimes(3);
  api.clear();await expect(api.session()).rejects.toThrow("AUTH_REQUIRED");expect(send).toHaveBeenCalledTimes(3);
 });
 it("unmapped JWT never becomes a successful LaosTravel sign in",async()=>{
  const send=vi.fn<typeof fetch>(async url=>String(url).includes("auth.example")?new Response(JSON.stringify(tokens)):String(url).endsWith("shared-contract")?envelope(getSharedContract()):new Response(JSON.stringify({data:null,error:{code:"AUTH_INVALID"}}),{status:401}));
  const api=new ConnectedBackend(config,send);await expect(api.authenticate("login",{email:"u@example.com",password:"password123"})).rejects.toThrow("AUTH_REQUIRED");await expect(api.session()).rejects.toThrow("AUTH_REQUIRED");expect(send).toHaveBeenCalledTimes(3);
 });
 it("no credentials means no provider or protected request",async()=>{const send=vi.fn();const api=new ConnectedBackend({url:"",key:""},send);await expect(api.authenticate("login",{email:"u@example.com",password:"password123"})).rejects.toThrow("CONFIGURATION_REQUIRED");await expect(api.apply({})).rejects.toThrow();expect(send).toHaveBeenCalledTimes(1)});
 it.each(["commissionQualification","activationRequires","refundedPaymentTerminal","inventoryRestoration"])("rejects policy drift in %s before mutation",key=>{const v=structuredClone(getSharedContract());(v.launchPolicy as Record<string,unknown>)[key]=null;expect(()=>validateSharedContract(v)).toThrow("CONTRACT_MISMATCH")});
 it.each(Object.keys(authority))("rejects authority drift in %s",key=>{const v=structuredClone(getSharedContract());(v.authority as Record<string,unknown>)[key]="CLIENT";expect(()=>validateSharedContract(v)).toThrow("CONTRACT_MISMATCH")});
 it("logout between token acquisition and dispatch prevents a protected request",async()=>{
  const send=vi.fn<typeof fetch>(async url=>String(url).includes("auth.example")?new Response(JSON.stringify(tokens)):String(url).endsWith("shared-contract")?envelope(getSharedContract()):envelope(profile));
  const api=new ConnectedBackend(config,send);await api.authenticate("login",{email:"u@example.com",password:"password123"});
  const before=send.mock.calls.length;const pending=api.request("/api/v1/bookings",{idempotencyKey:"same-key"},true);api.clear();
  await expect(pending).rejects.toThrow("AUTH_REQUIRED");expect(send).toHaveBeenCalledTimes(before);
 });
 it("concurrent expired access refreshes once and sends the refreshed token",async()=>{
  let now=Date.now();const clock=vi.spyOn(Date,"now").mockImplementation(()=>now);let refreshes=0;
  try{
   const send=vi.fn<typeof fetch>(async(url,init)=>{
    if(String(url).includes("grant_type=refresh_token")){refreshes++;expect(JSON.parse(init!.body as string)).toEqual({refresh_token:"refresh"});return new Response(JSON.stringify({...tokens,access_token:"renewed"}));}
    if(String(url).includes("auth.example"))return new Response(JSON.stringify({...tokens,expires_in:60}));
    if(String(url).endsWith("shared-contract"))return envelope(getSharedContract());
    expect((init!.headers as Record<string,string>).Authorization).toBe(refreshes===0?"Bearer verified-token":"Bearer renewed");return envelope(profile);
   });
   const api=new ConnectedBackend(config,send);await api.authenticate("login",{email:"u@example.com",password:"password123"});
   now+=120000;await Promise.all([api.session(),api.session()]);expect(refreshes).toBe(1);
  }finally{clock.mockRestore()}
 });
 it("rejects stale version and unsafe price selection",()=>{expect(()=>validateSharedContract({...getSharedContract(),version:"old"})).toThrow();expect(()=>validateQuote({...quote,availabilityId:"other"},selection)).toThrow();expect(()=>validateQuote({...quote,customerTotal:"1.2"},selection)).toThrow();expect(()=>validateQuote({...quote,expiresAt:"2000-01-01"},selection)).toThrow("QUOTE_EXPIRED")});
 it("contract mismatch never sends a booking or application mutation",async()=>{const send=vi.fn<typeof fetch>(async()=>envelope({...getSharedContract(),version:"old"}));const api=new ConnectedBackend(config,send);await expect(api.book({} as never)).rejects.toThrow("CONTRACT_MISMATCH");expect(send).toHaveBeenCalledTimes(1);expect(String(send.mock.calls[0][0])).toContain("shared-contract")});
 it("late protected response after sign-out is rejected",async()=>{
  let resolve!:(value:Response)=>void;let delay=false;
  const api=new ConnectedBackend(config,async url=>String(url).includes("auth.example")?new Response(JSON.stringify(tokens)):String(url).endsWith("shared-contract")?envelope(getSharedContract()):delay?new Promise(r=>resolve=r):envelope(profile));
  await api.authenticate("login",{email:"u@example.com",password:"password123"});delay=true;const pending=api.session();await new Promise(r=>setTimeout(r,0));api.clear();resolve(envelope(profile));await expect(pending).rejects.toThrow("AUTH_REQUIRED");
 });
});
describe("frozen booking attempt",()=>{
 it("double submit and uncertain retry preserve one owner/body/key, including expired quote",async()=>{
  const input={serviceId:"s",date:"2099-01-01",quantity:1,priceQuoteId:"q",availabilityToken:"t",traveller:{name:"N",email:"u@example.com"},idempotencyKey:"original-key"};
  const bodies:unknown[]=[];const api={session:vi.fn().mockResolvedValue(profile),book:vi.fn(async body=>{bodies.push(structuredClone(body));if(bodies.length===1)throw new Error("NETWORK_ERROR");return {bookingId:"b",bookingRef:"LT-B",replayed:true}})};
  const attempt=new BookingAttempt(profile.userId,input);const first=await Promise.allSettled([attempt.submit(api as never),attempt.submit(api as never)]);expect(first.every(x=>x.status==="rejected")).toBe(true);expect(api.book).toHaveBeenCalledTimes(1);
  input.traveller.name="Changed after request";expect(await attempt.submit(api as never)).toMatchObject({replayed:true});expect(bodies[0]).toEqual(bodies[1]);await attempt.submit(api as never);expect(api.book).toHaveBeenCalledTimes(2);
 });
 it("a changed signed-in owner cannot retry somebody else's booking",async()=>{const api={session:vi.fn().mockResolvedValue({...profile,userId:"other"}),book:vi.fn()};await expect(new BookingAttempt(profile.userId,{} as never).submit(api as never)).rejects.toThrow("ACCOUNT_CHANGED");expect(api.book).not.toHaveBeenCalled()});
});
