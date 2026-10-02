"use client";
import {useCallback,useEffect,useState} from "react";

type Booking={bookingId:string;bookingRef:string;status:string;paymentStatus:string;createdAt:string;serviceId:string;quantity:number;currency:string;customerTotal:string;commercialPath:"TRIAL_FREE"|"COMMISSIONABLE"};
type Event="CONFIRM"|"CHECK_IN"|"START_SERVICE"|"COMPLETE"|"CANCEL"|"MARK_NO_SHOW";

function actions(status:string):{event:Event;label:string}[]{
 if(status==="REQUESTED")return[{event:"CONFIRM",label:"ยืนยันการจอง"},{event:"CANCEL",label:"ยกเลิก"}];
 if(status==="CONFIRMED")return[{event:"CHECK_IN",label:"เช็กอิน"},{event:"CANCEL",label:"ยกเลิก"},{event:"MARK_NO_SHOW",label:"ลูกค้าไม่มา"}];
 if(status==="CHECKED_IN")return[{event:"START_SERVICE",label:"เริ่มให้บริการ"},{event:"COMPLETE",label:"เสร็จสิ้น"},{event:"CANCEL",label:"ยกเลิก"}];
 if(status==="IN_SERVICE")return[{event:"COMPLETE",label:"เสร็จสิ้น"}];
 return[];
}

export function PartnerBookingList({partnerId}:{partnerId:string}){
 const [rows,setRows]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [updating,setUpdating]=useState<string|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{setLoading(true);setError("");
  try{const r=await fetch(`/api/v1/partners/${encodeURIComponent(partnerId)}/bookings?limit=50`,{signal,credentials:"same-origin"});const body=await r.json();if(!r.ok||body.error)throw new Error("BOOKINGS_UNAVAILABLE");setRows(body.data as Booking[])}
  catch(e:unknown){if(!(e instanceof Error && e.name==="AbortError"))setError("ไม่สามารถโหลดรายการจองได้ในขณะนี้")}finally{setLoading(false)}
 },[partnerId]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 async function update(bookingId:string,event:Event){setUpdating(bookingId);setError("");
  try{const r=await fetch(`/api/v1/partners/${encodeURIComponent(partnerId)}/bookings/${encodeURIComponent(bookingId)}/status`,{method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({event})});const body=await r.json();if(!r.ok||body.error)throw new Error("UPDATE_FAILED");await load()}
  catch{setError("ไม่สามารถอัปเดตสถานะการจองได้ในขณะนี้")}finally{setUpdating(null)}
 }
 if(loading&&rows.length===0)return <p aria-live="polite">กำลังโหลดรายการจอง…</p>;
 if(error&&rows.length===0)return <p role="alert">{error}</p>;
 if(rows.length===0)return <p>ยังไม่มีรายการจอง</p>;
 return <div aria-label="Partner bookings">{error&&<p role="alert">{error}</p>}{rows.map(b=><article key={b.bookingId}>
  <h3>{b.bookingRef}</h3><p>{b.status} · {b.paymentStatus}</p>
  <p>{b.quantity} × {b.serviceId}</p><p>{b.customerTotal} {b.currency}</p>
  <div aria-label="Booking actions">{actions(b.status).map(a=><button key={a.event} type="button" disabled={updating===b.bookingId} onClick={()=>void update(b.bookingId,a.event)}>{updating===b.bookingId?"กำลังอัปเดต…":a.label}</button>)}</div>
 </article>)}</div>;
}
