import {isValidCoordinates,type GeoCoordinates} from "../location/model";

export const smartPickupStatuses=["PENDING","ACCEPTED","DECLINED","CANCELLED"] as const;
export type SmartPickupStatus=(typeof smartPickupStatuses)[number];
export type SmartPickupBookingStatus="REQUESTED"|"CONFIRMED"|"CHECKED_IN"|"IN_SERVICE"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";

export class SmartPickupValidationError extends Error{
 constructor(public code:"INVALID_COORDINATES"|"INVALID_LABEL"|"NOT_ELIGIBLE"|"INVALID_TRANSITION"){super(code)}
}

export function validateSmartPickupPoint(input:GeoCoordinates&{label?:unknown}):{latitude:number;longitude:number;label:string|null}{
 if(!isValidCoordinates(input))throw new SmartPickupValidationError("INVALID_COORDINATES");
 if(input.label!==undefined&&input.label!==null&&typeof input.label!=="string")throw new SmartPickupValidationError("INVALID_LABEL");
 const label=typeof input.label==="string"?input.label.trim():null;
 if(label&&label.length>160)throw new SmartPickupValidationError("INVALID_LABEL");
 return {latitude:input.latitude,longitude:input.longitude,label:label||null};
}

export function canRequestSmartPickup(input:{
 bookingStatus:SmartPickupBookingStatus;
 serviceKind:string|null;
 vehicleType:string|null;
 enabled:boolean;
 requiresOperatorApproval:boolean;
}):boolean{
 return input.bookingStatus==="CONFIRMED"
  &&input.serviceKind==="INTERCITY_TRANSPORT"
  &&input.vehicleType==="VIP_VAN"
  &&input.enabled
  &&input.requiresOperatorApproval;
}

export function nextSmartPickupStatus(input:{
 current:SmartPickupStatus;
 actor:"TRAVELLER"|"OPERATOR";
 decision:"ACCEPT"|"DECLINE"|"CANCEL";
}):SmartPickupStatus{
 if(input.current!=="PENDING")throw new SmartPickupValidationError("INVALID_TRANSITION");
 if(input.actor==="TRAVELLER"&&input.decision==="CANCEL")return "CANCELLED";
 if(input.actor==="OPERATOR"&&input.decision==="ACCEPT")return "ACCEPTED";
 if(input.actor==="OPERATOR"&&input.decision==="DECLINE")return "DECLINED";
 throw new SmartPickupValidationError("INVALID_TRANSITION");
}

export function hasMeasuredDetour(input:{routeDetourM:number|null;routeDetourSeconds:number|null}):boolean{
 return Number.isSafeInteger(input.routeDetourM)
  &&(input.routeDetourM as number)>=0
  &&Number.isSafeInteger(input.routeDetourSeconds)
  &&(input.routeDetourSeconds as number)>=0;
}
