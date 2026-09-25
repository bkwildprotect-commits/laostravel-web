function stable(value:unknown):unknown{
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
 return value;
}
export function canonicalBookingPayload(value:unknown):string{return JSON.stringify(stable(value))}
export async function sha256Hex(value:string):Promise<string>{
 const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function bookingRequestHash(payload:unknown):Promise<string>{return sha256Hex(canonicalBookingPayload(payload))}
