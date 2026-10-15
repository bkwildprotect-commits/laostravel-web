import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smoke} from '../staging-smoke.mjs';
const contract={bookingStatuses:['REQUESTED','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','CANCELLED','EXPIRED','NO_SHOW'],paymentStatuses:['UNPAID','PAID','REFUNDED','DISPUTED'],version:'2026-10-10.v2',launchPolicy:{currency:'LAK',paymentMethod:'PAY_AT_PARTNER',organicRanking:'NO_PAY_TO_RANK',activationRequires:'BOOKABLE_SERVICE_IN_OPEN_AREA',commissionAfterExpiry:'REQUIRES_SEPARATELY_ACCEPTED_TERMS',freeCalendarMonths:6,launchFreeCommissionRateBps:0,commissionQualification:'COMPLETED_AND_PAID_WITH_ACCEPTED_TERMS',refundedPaymentTerminal:true,inventoryRestoration:'UNUSED_FUTURE_BOOKABLE_CAPACITY_ONCE'},authority:{displayCurrency:'CLIENT_PRESENTATION_ONLY',...Object.fromEntries(['bookingLifecycle','paymentTruth','partnerVerification','commercialTerms','inventory','serviceArea','verifiedReview','rewards','gpsVerification','priceAndDiscount'].map(k=>[k,'SERVER']))}};
const mock=({ready=false,auth=401,body=contract}={})=>async(url,options)=>{
 assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.method,undefined);
 if(url.endsWith('shared-contract'))return Response.json({data:body});
 if(url.endsWith('production-readiness'))return Response.json({data:{ready,missing:['BOOKING_API_APPROVED','PARTNER_EVIDENCE_UPLOAD_APPROVED']}});
 return Response.json({data:null,error:{code:auth===503?'AUTH_NOT_CONFIGURED':'AUTH_REQUIRED'}},{status:auth});
};
test('smoke is read-only and never claims live Auth/storage acceptance',async()=>{
 const r=await smoke('https://staging.example',mock());assert.equal(r.liveAuthentication,'not-tested');assert.equal(r.storagePermissions,'not-tested');
});
test('unconfigured authentication is fail-closed but remains untested live',async()=>assert.equal((await smoke('https://staging.example',mock({auth:503}))).anonymousSession,'passed'));
test('open gates, anonymous 200 and contract policy drift fail',async()=>{
 for(const send of [mock({ready:true}),mock({auth:200}),mock({body:{...contract,authority:{}}})])await assert.rejects(smoke('https://staging.example',send));
});
test('insecure or credential-bearing smoke targets fail',async()=>{
 for(const base of ['http://staging.example','https://secret:secret@staging.example','https://staging.example?token=secret'])await assert.rejects(smoke(base,mock()));
});
