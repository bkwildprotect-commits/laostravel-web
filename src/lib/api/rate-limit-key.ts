const encoder=new TextEncoder();
function bytesToHex(bytes:Uint8Array){return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}
export async function deriveRateLimitKey(input:{namespace:string;identifier:string;secret:string}){
 const namespace=input.namespace.trim();const identifier=input.identifier.trim();if(!namespace||!identifier||input.secret.length<32)throw new Error("INVALID_RATE_LIMIT_KEY_INPUT");
 const key=await crypto.subtle.importKey("raw",encoder.encode(input.secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signature=await crypto.subtle.sign("HMAC",key,encoder.encode(namespace+"\n"+identifier));
 return namespace+":"+bytesToHex(new Uint8Array(signature));
}
