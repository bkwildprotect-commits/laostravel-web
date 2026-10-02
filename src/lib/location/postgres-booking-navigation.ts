import type {Pool} from "pg";
import {canExposeLocation,hasBookingNavigationAccess,navigationUrl,type GeoVisibility,type GeoVerificationStatus,type NavigationBookingStatus} from "./model";

export class BookingLocationAccessDeniedError extends Error{constructor(){super("BOOKING_LOCATION_ACCESS_DENIED")}}
export type BookingNavigation={bookingId:string;serviceId:string;name:string;area:string;latitude:number;longitude:number;navigationUrl:string};

export async function getBookingNavigation(pool:Pool,input:{userId:string;bookingId:string}):Promise<BookingNavigation>{
 const result=await pool.query<{
  booking_id:string;booking_status:NavigationBookingStatus;service_id:string;name:string;area:string;latitude:string;longitude:string;visibility:GeoVisibility;verification_status:GeoVerificationStatus;
 }>(`
  SELECT b.id AS booking_id,b.status AS booking_status,bi.service_id,g.name,g.area,g.latitude,g.longitude,g.visibility,g.verification_status
  FROM bookings b
  JOIN booking_items bi ON bi.booking_id=b.id
  JOIN geo_locations g ON g.service_id=bi.service_id AND g.kind='SERVICE_MEETING_POINT'
  WHERE b.id=$1 AND b.user_id=$2
  LIMIT 1
 `,[input.bookingId,input.userId]);
 const row=result.rows[0];
 if(!row||!canExposeLocation({visibility:row.visibility,verificationStatus:row.verification_status,hasBookingAccess:hasBookingNavigationAccess(row.booking_status)}))throw new BookingLocationAccessDeniedError();
 const coordinates={latitude:Number(row.latitude),longitude:Number(row.longitude)};
 return {bookingId:row.booking_id,serviceId:row.service_id,name:row.name,area:row.area,...coordinates,navigationUrl:navigationUrl(coordinates)};
}
