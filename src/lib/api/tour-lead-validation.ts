export type TourLeadInput={name:string;phone:string;email:string;date:string;guests:number;consent:boolean};
export type TourLeadValidation={ok:true;value:TourLeadInput}|{ok:false;code:"INVALID_NAME"|"INVALID_PHONE"|"INVALID_EMAIL"|"INVALID_DATE"|"INVALID_GUESTS"|"CONSENT_REQUIRED"};
export function validateTourLead(raw:unknown):TourLeadValidation{
 if(!raw||typeof raw!=="object")return {ok:false,code:"INVALID_NAME"};
 const x=raw as Record<string,unknown>;const name=typeof x.name==="string"?x.name.trim():"";if(name.length<2||name.length>100)return {ok:false,code:"INVALID_NAME"};
 const phone=typeof x.phone==="string"?x.phone.trim():"";if(!/^\+?[0-9 ()-]{6,24}$/.test(phone))return {ok:false,code:"INVALID_PHONE"};
 const email=typeof x.email==="string"?x.email.trim().toLowerCase():"";if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return {ok:false,code:"INVALID_EMAIL"};
 const date=typeof x.date==="string"?x.date:"";if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+"T00:00:00Z")))return {ok:false,code:"INVALID_DATE"};
 const guests=typeof x.guests==="number"?x.guests:Number(x.guests);if(!Number.isSafeInteger(guests)||guests<1||guests>100)return {ok:false,code:"INVALID_GUESTS"};
 if(x.consent!==true)return {ok:false,code:"CONSENT_REQUIRED"};
 return {ok:true,value:{name,phone,email,date,guests,consent:true}};
}
