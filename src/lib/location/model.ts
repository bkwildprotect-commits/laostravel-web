export const geoLocationKinds=["PARTNER_VENUE","SERVICE_MEETING_POINT","ATTRACTION"] as const;export type GeoLocationKind=(typeof geoLocationKinds)[number];
export const geoVerificationStatuses=["UNVERIFIED","PENDING","VERIFIED","REJECTED"] as const;export type GeoVerificationStatus=(typeof geoVerificationStatuses)[number];
export const geoVisibilities=["PUBLIC","BOOKING_ONLY","PRIVATE"] as const;export type GeoVisibility=(typeof geoVisibilities)[number];
export type GeoCoordinates={latitude:number;longitude:number};
export function isValidCoordinates(value:GeoCoordinates):boolean{return Number.isFinite(value.latitude)&&Number.isFinite(value.longitude)&&value.latitude>=-90&&value.latitude<=90&&value.longitude>=-180&&value.longitude<=180}
export function navigationUrl(value:GeoCoordinates):string{if(!isValidCoordinates(value))throw new Error("Invalid GPS coordinates");return `https://www.google.com/maps/dir/?api=1&destination=${value.latitude},${value.longitude}`}
export function canExposeLocation(input:{visibility:GeoVisibility;verificationStatus:GeoVerificationStatus;hasBookingAccess:boolean}):boolean{if(input.visibility==="PRIVATE")return false;if(input.verificationStatus!=="VERIFIED")return false;return input.visibility==="PUBLIC"||input.hasBookingAccess}
export type NavigationBookingStatus="REQUESTED"|"CONFIRMED"|"CHECKED_IN"|"IN_SERVICE"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";
export function hasBookingNavigationAccess(status:NavigationBookingStatus):boolean{return status==="CONFIRMED"||status==="CHECKED_IN"||status==="IN_SERVICE"||status==="COMPLETED"}
