export type ProductionReadiness={ready:true}|{ready:false;missing:string[]};

function validUrl(raw:string|undefined,protocols:readonly string[],options:{allowCredentials?:boolean}={}){
 if(!raw?.trim())return false;
 try{
  const url=new URL(raw.trim());
  return protocols.includes(url.protocol)&&Boolean(url.hostname)&&
   (options.allowCredentials===true||(!url.username&&!url.password))&&
   !url.search&&!url.hash;
 }catch{return false}
}

export function getCoreRuntimeConfigurationIssues(env:Record<string,string|undefined>=process.env){
 const issues:string[]=[];
 if(!validUrl(env.DATABASE_URL,["postgres:","postgresql:"],{allowCredentials:true}))issues.push("DATABASE_URL");
 const hold=Number(env.BOOKING_HOLD_MINUTES);
 if(!Number.isSafeInteger(hold)||hold<1||hold>1440)issues.push("BOOKING_HOLD_MINUTES");
 const issuer=env.AUTH_ISSUER_URL?.trim();
 if(!validUrl(issuer,["https:"]))issues.push("AUTH_ISSUER_URL");
 if(!env.AUTH_AUDIENCE?.trim())issues.push("AUTH_AUDIENCE");
 const jwks=env.AUTH_JWKS_URL?.trim();
 if(jwks){
  if(!validUrl(jwks,["https:"]))issues.push("AUTH_JWKS_URL");
  else if(issuer){
   try{if(new URL(jwks).origin!==new URL(issuer).origin)issues.push("AUTH_JWKS_URL")}catch{}
  }
 }
 return issues;
}

export function getProductionReadiness(env:Record<string,string|undefined>=process.env):ProductionReadiness{
 const missing=getCoreRuntimeConfigurationIssues(env);
 if(!validUrl(env.OBJECT_STORAGE_ENDPOINT,["https:"]))missing.push("OBJECT_STORAGE_ENDPOINT");
 if(!env.OBJECT_STORAGE_BUCKET?.trim())missing.push("OBJECT_STORAGE_BUCKET");
 if(env.BOOKING_API_APPROVED!=="true")missing.push("BOOKING_API_APPROVED");
 if(env.PARTNER_EVIDENCE_UPLOAD_APPROVED!=="true")missing.push("PARTNER_EVIDENCE_UPLOAD_APPROVED");
 return missing.length?{ready:false,missing}:{ready:true};
}
