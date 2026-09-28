"use client";
import {useState} from "react";
import {PartnerBookingList} from "./partner/PartnerBookingList";
const modules=["Overview","Bookings","Services","Availability","Pricing","Photos","Reviews","Business Profile","Staff","Settings","Support"];
export function PartnerDashboard(){
 const [partnerId,setPartnerId]=useState("");
 return <div className="partnerDashboard"><aside><h2>Partner Dashboard</h2><nav>{modules.map(m=><button key={m}>{m}</button>)}</nav></aside><section><p className="eyebrow">PARTNER WORKSPACE</p><h1>Bookings</h1><div className="statusCard"><strong>Shared booking data</strong><p>Bookings are loaded from the same LaosTravel backend used by Traveller booking.</p><label>Partner ID <input value={partnerId} onChange={e=>setPartnerId(e.target.value)} placeholder="Partner ID"/></label></div>{partnerId.trim()?<PartnerBookingList partnerId={partnerId.trim()}/>:<div className="emptyState"><strong>Select partner</strong><p>Enter your Partner ID to load authorized bookings.</p></div>}</section></div>
}