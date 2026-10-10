"use client";
import {FormEvent,useRef,useState} from "react";
import {ClientError,connectedBackend} from "@/lib/client/connected-backend";
type Mode="login"|"register"|"forgot";
export function AuthForm({mode}:{mode:Mode}){
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const lock=useRef(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setMessage("");
  const form=e.currentTarget;const data=new FormData(form);
  try{const session=await connectedBackend.authenticate(mode,{email:String(data.get("email")??"").trim(),password:String(data.get("password")??""),name:String(data.get("name")??"").trim()});
   setMessage(session?"Signed in to your verified LaosTravel account.":mode==="forgot"?"Recovery instructions requested. Check your email if the account is eligible.":"Check your email to confirm your account. LaosTravel access still requires an active mapped account.");
  }catch(error){const code=error instanceof ClientError?error.code:"SERVICE_UNAVAILABLE";setMessage(code==="CONFIGURATION_REQUIRED"?"Sign-in service is not configured yet.":code==="AUTH_INVALID"||code==="AUTH_REQUIRED"?"Unable to sign in. An active LaosTravel account is required.":"Unable to complete this request. Please try again or contact support.")}
  finally{const password=form.elements.namedItem("password");if(password instanceof HTMLInputElement)password.value="";lock.current=false;setBusy(false)}
 }
 return <form className="authForm" onSubmit={submit}>{mode==="register"&&<label>Full name<input name="name" autoComplete="name" disabled={busy} required/></label>}<label>Email<input type="email" name="email" autoComplete="email" disabled={busy} required/></label>{mode!=="forgot"&&<label>Password<input type="password" name="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={8} disabled={busy} required/></label>}<button className="primaryButton" type="submit" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":mode==="register"?"Create account":"Send recovery instructions"}</button>{mode==="login"&&<button type="button" className="ghostControl" disabled={busy} onClick={()=>{connectedBackend.clear();setMessage("Signed out.")}}>Sign out</button>}{message&&<p className="formNotice" role="status">{message}</p>}</form>
}
