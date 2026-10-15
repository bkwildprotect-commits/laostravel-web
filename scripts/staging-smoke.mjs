// Read-only checks. Does not log tokens, passwords, response bodies or account data.
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export async function smoke(base,send=fetch){
 const url=new URL(base);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('STAGING_HTTPS_ORIGIN_REQUIRED');
 const get=async path=>{
  const r=await send(url.origin+path,{headers:{accept:'application/json'},redirect:'error',credentials:'omit',signal:AbortSignal.timeout(20000)});
  return {status:r.status,body:await r.json()};
 };
 const contract=await get('/api/v1/meta/shared-contract');
 if(contract.status!==200||contract.body?.data?.version!=='2026-10-10.v2')throw new Error('CONTRACT_MISMATCH');
 const {launchPolicy:p,authority:a}=contract.body.data;
 if(p?.currency!=='LAK'||p?.paymentMethod!=='PAY_AT_PARTNER'||p?.organicRanking!=='NO_PAY_TO_RANK'||p?.activationRequires!=='BOOKABLE_SERVICE_IN_OPEN_AREA'||p?.commissionAfterExpiry!=='REQUIRES_SEPARATELY_ACCEPTED_TERMS'||a?.displayCurrency!=='CLIENT_PRESENTATION_ONLY'||JSON.stringify(contract.body.data.bookingStatuses)!==JSON.stringify(['REQUESTED','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','CANCELLED','EXPIRED','NO_SHOW'])||JSON.stringify(contract.body.data.paymentStatuses)!==JSON.stringify(['UNPAID','PAID','REFUNDED','DISPUTED'])||p?.freeCalendarMonths!==6||p?.launchFreeCommissionRateBps!==0||p?.commissionQualification!=='COMPLETED_AND_PAID_WITH_ACCEPTED_TERMS'||p?.refundedPaymentTerminal!==true||p?.inventoryRestoration!=='UNUSED_FUTURE_BOOKABLE_CAPACITY_ONCE'||['bookingLifecycle','paymentTruth','partnerVerification','commercialTerms','inventory','serviceArea','verifiedReview','rewards','gpsVerification','priceAndDiscount'].some(k=>a?.[k]!=='SERVER'))throw new Error('CONTRACT_POLICY_MISMATCH');
 const readiness=await get('/api/v1/meta/production-readiness');
 if(readiness.status!==200||readiness.body?.data?.ready!==false||!['BOOKING_API_APPROVED','PARTNER_EVIDENCE_UPLOAD_APPROVED'].every(k=>readiness.body.data.missing?.includes(k)))throw new Error('STAGING_GATES_NOT_CLOSED');
 const session=await get('/api/v1/auth/session');
 if(![401,503].includes(session.status)||session.body?.data!==null||!['AUTH_REQUIRED','AUTH_NOT_CONFIGURED'].includes(session.body?.error?.code))throw new Error('AUTH_FAIL_CLOSED_CHECK_FAILED');
 return {contract:'passed',gatesClosed:'passed',anonymousSession:'passed',liveAuthentication:'not-tested',storagePermissions:'not-tested'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const origin=process.env.STAGING_BASE_URL;
 // Owner pins the actual selected Staging origin, avoiding accidental Production probing.
 if(!origin||origin!==process.env.STAGING_SMOKE_APPROVED_ORIGIN){console.error('STAGING_ORIGIN_APPROVAL_REQUIRED');process.exitCode=1;}
 else smoke(origin).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('STAGING_SMOKE_FAILED: inspect sanitized server diagnostics; no response data logged.');process.exitCode=1;});
}
