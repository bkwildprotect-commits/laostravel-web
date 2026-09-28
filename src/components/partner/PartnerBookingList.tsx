"use client";
import {useEffect,useState} from "react";

type Booking={bookingId:string;bookingRef:string;status:string;paymentStatus:string;createdAt:string;serviceId:string;quantity:number;currency:string;customerTotal:string;commercialPath:"TRIAL_FREE"|"COMMISSIONABLE"};

export function PartnerBookingList({partnerId}:{partnerId:string}){
 const [rows,setRows]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");
  fetch(`/api/v1/partners/${encodeURIComponent(partnerId)}/bookings?limit=50`,{signal:controller.signal,credentials:"same-origin"})
   .then(async r=>{const body=await r.json();if(!r.ok||body.error)throw new Error("BOOKINGS_UNAVAILABLE");return body.data as Booking[]})
   .then(setRows).catch(e=>{if(e?.name!=="AbortError")setError("ไม่สามารถโหลดรายการจองได้ในขณะนี้")}).finally(()=>setLoading(false));
  return()=>controller.abort();
 },[partnerId]);
 if(loading)return <p aria-live="polite">กำลังโหลดรายการจอง…</p>;
 if(error)return <p role="alert">{error}</p>;
 if(rows.length===0)return <p>ยังไม่มีรายการจอง</p>;
 return <div aria-label="Partner bookings">{rows.map(b=><article key={b.bookingId}>
  <h3>{b.bookingRef}</h3><p>{b.status} · {b.paymentStatus}</p>
  <p>{b.quantity} × {b.serviceId}</p><p>{b.customerTotal} {b.currency}</p>
 </article>)}</div>;
}
