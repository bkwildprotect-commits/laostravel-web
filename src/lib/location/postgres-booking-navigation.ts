import type {Pool} from "pg";
import {hasBookingNavigationAccess,navigationUrl,type NavigationBookingStatus} from "./model";
export class BookingLocationAccessDeniedError extends Error{constructor(){super("BOOKING_LOCATION_ACCESS_DENIED")}}
export type BookingNavigation={bookingId:string;serviceId:string;name:string;area:string;latitude:number;longitude:number;navigationUrl:string};
export async function getBookingNavigation(pool:Pool,input:{userId:string;bookingId:string}):Promise<BookingNavigation>{
 const result=await pool.query<{booking_id:string;booking_status:NavigationBookingStatus;service_id:string;name:string;area:string;latitude:string;longitude:string}>(`
  SELECT b.id AS booking_id,b.status AS booking_status,s.service_id,s.name,s.area,s.latitude,s.longitude
  FROM bookings b JOIN booking_location_snapshots s ON s.booking_id=b.id
  WHERE b.id=$1 AND b.user_id=$2 LIMIT 1
 `,[input.bookingId,input.userId]);
 const row=result.rows[0];
 if(!row||!hasBookingNavigationAccess(row.booking_status))throw new BookingLocationAccessDeniedError();
 const coordinates={latitude:Number(row.latitude),longitude:Number(row.longitude)};
 return {bookingId:row.booking_id,serviceId:row.service_id,name:row.name,area:row.area,...coordinates,navigationUrl:navigationUrl(coordinates)};
}
