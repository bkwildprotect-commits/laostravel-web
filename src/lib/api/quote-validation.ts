import type {AvailabilityQuoteRequest} from "./contracts";
export function validateAvailabilityQuote(input:unknown):{ok:true;value:AvailabilityQuoteRequest}|{ok:false;errors:string[]}{
 const errors:string[]=[];if(!input||typeof input!=="object")return {ok:false,errors:["Invalid request body"]};
 const x=input as Partial<AvailabilityQuoteRequest>;
 if(!x.serviceId||typeof x.serviceId!=="string")errors.push("serviceId is required");
 if(!x.date||typeof x.date!=="string"||Number.isNaN(Date.parse(x.date)))errors.push("date must be a valid date");
 if(!Number.isInteger(x.quantity)||Number(x.quantity)<1||Number(x.quantity)>100)errors.push("quantity must be an integer from 1 to 100");
 if(x.optionId!==undefined&&typeof x.optionId!=="string")errors.push("optionId must be a string");
 return errors.length?{ok:false,errors}:{ok:true,value:x as AvailabilityQuoteRequest};
}
