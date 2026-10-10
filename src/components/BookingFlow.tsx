"use client";
import {useRef,useState} from "react";
import type {AvailabilityQuote,IntercityDeparture} from "@/lib/api/contracts";
import {BookingAttempt,ClientError,connectedBackend} from "@/lib/client/connected-backend";
export function BookingFlow({serviceId,locale="en"}:{serviceId?:string;locale?:string}){
 const [date,setDate]=useState("");const [quantity,setQuantity]=useState(1);const [rows,setRows]=useState<IntercityDeparture[]>([]);const [selected,setSelected]=useState<IntercityDeparture>();const [stop,setStop]=useState("");
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [quote,setQuote]=useState<AvailabilityQuote>();const [receipt,setReceipt]=useState<string>();const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 const lock=useRef(false);const attempt=useRef<BookingAttempt|null>(null);
 async function run(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setNotice("");try{await work()}catch(error){if(error instanceof ClientError&&error.code==="PRICE_QUOTE_EXPIRED"){attempt.current=null;setQuote(undefined);setNotice("The quote expired before a booking was created. Check availability and price again.")}else setNotice("Unable to confirm this request. Sign in if required, then retry. No success is assumed.")}finally{lock.current=false;setBusy(false)}}
 async function search(){await run(async()=>{setRows([]);setSelected(undefined);setQuote(undefined);setStop("");const data=await connectedBackend.departures(date,locale);const available=data.filter(d=>!serviceId||d.serviceId===serviceId);setRows(available);if(!available.length)setNotice("No bookable departures are available for this date.")})}
 async function price(){await run(async()=>{if(!selected||!name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||selected.vehicleType==="BUS"&&!stop)throw new Error("SELECTION_REQUIRED");
  const q=await connectedBackend.quote({serviceId:selected.serviceId,availabilityId:selected.availabilityId,date,quantity});setQuote(q);
 })}
 async function book(){await run(async()=>{if(!quote)throw new Error("QUOTE_REQUIRED");if(!attempt.current){const session=await connectedBackend.session();attempt.current=new BookingAttempt(session.userId,{serviceId:quote.serviceId,date:quote.date,quantity:quote.quantity,priceQuoteId:quote.priceQuoteId,availabilityToken:quote.availabilityToken,traveller:{name:name.trim(),email:email.trim()},idempotencyKey:crypto.randomUUID(),...(stop?{designatedStopId:stop}:{})})}
  const result=await attempt.current.submit(connectedBackend);setReceipt(result.bookingRef);
 })}
 const frozen=busy||quote!==undefined||attempt.current!==null;
 return <div className="bookingFlow"><section className="bookingStage"><h2>{receipt?"Booking reference":"Select a real departure"}</h2>{receipt?<div role="status"><strong>{receipt}</strong><p>Your booking request was received. This does not confirm service or payment.</p></div>:<>
 <label>Date<input type="date" value={date} disabled={frozen} onChange={e=>{setDate(e.target.value);setRows([]);setSelected(undefined)}}/></label><button type="button" className="primaryButton" disabled={frozen||!date} onClick={()=>void search()}>Find departures</button>
 {rows.map(d=><label key={d.availabilityId}><input type="radio" name="departure" disabled={frozen} checked={selected?.availabilityId===d.availabilityId} onChange={()=>{setSelected(d);setStop("")}}/>{d.serviceName} · {d.origin.name} → {d.destination.name} · {d.departureAt} · {d.remainingSeats} seats</label>)}
 {selected&&<><label>Guests / quantity<input type="number" min="1" max={Math.min(100,selected.remainingSeats)} value={quantity} disabled={frozen} onChange={e=>setQuantity(Number(e.target.value))}/></label>
 {selected.vehicleType==="BUS"&&<label>Boarding stop<select value={stop} disabled={frozen} onChange={e=>setStop(e.target.value)}><option value="">Choose a verified boarding stop</option>{selected.designatedStops.filter(s=>s.role==="BOARDING"||s.role==="BOTH").map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
 <label>Full name<input value={name} autoComplete="name" disabled={frozen} onChange={e=>setName(e.target.value)}/></label><label>Email<input type="email" value={email} autoComplete="email" disabled={frozen} onChange={e=>setEmail(e.target.value)}/></label>
 {!quote?<button className="primaryButton" type="button" disabled={busy||quantity<1||quantity>Math.min(100,selected.remainingSeats)} onClick={()=>void price()}>Check availability and price</button>:<div><p>Total: {quote.customerTotal} {quote.currency}</p><p>Pay at partner. Coupon and Coins redemption is currently unavailable.</p><button className="primaryButton" disabled={busy} type="button" onClick={()=>void book()}>{attempt.current?"Retry same booking":"Submit booking request"}</button>{!attempt.current&&<button type="button" disabled={busy} onClick={()=>setQuote(undefined)}>Change selection</button>}</div>}
 </>}
 </>}{notice&&<p role="alert">{notice}</p>}{busy&&<p role="status">Please wait…</p>}{serviceId&&<small>Service reference: {serviceId}</small>}</section></div>
}
