export function backendReady(){
 const required=["DATABASE_URL","AUTH_ISSUER_URL","AUTH_AUDIENCE"] as const;
 const missing=required.filter(k=>!process.env[k]?.trim());
 return {ready:missing.length===0,missing};
}
