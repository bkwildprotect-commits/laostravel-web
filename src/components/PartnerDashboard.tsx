"use client";
import {useEffect,useState} from "react";
import {PartnerBookingList} from "./partner/PartnerBookingList";
import {connectedBackend,type WebSession} from "@/lib/client/connected-backend";
export function PartnerDashboard(){
 const [partners,setPartners]=useState<WebSession["partners"]>([]);const [partnerId,setPartnerId]=useState("");const [error,setError]=useState("");
 useEffect(()=>{let active=true;connectedBackend.session().then(s=>{if(active)setPartners(s.partners.filter(p=>p.canManage))}).catch(()=>{if(active)setError("Sign in with an approved active Partner account to load bookings.")});return()=>{active=false}},[]);
 return <div className="partnerDashboard"><section><p className="eyebrow">PARTNER WORKSPACE</p><h1>Bookings</h1>{error&&<p role="alert">{error}</p>}<label>Your approved Partners<select value={partnerId} onChange={e=>setPartnerId(e.target.value)}><option value="">Select Partner</option>{partners.map(p=><option value={p.partnerId} key={p.partnerId}>{p.name}</option>)}</select></label>{partnerId?<PartnerBookingList key={partnerId} partnerId={partnerId}/>:<p>No Partner selected. Pending applications do not grant access.</p>}</section></div>
}
