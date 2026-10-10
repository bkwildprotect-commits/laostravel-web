import {bookingStatuses,paymentStatuses} from "../shared/cross-platform-contract";
import {ClientError} from "./connected-backend";
export function parsePartnerBookings(value:unknown){
 if(!Array.isArray(value))throw new ClientError("INVALID_RESPONSE");
 for(const row of value){if(!row||typeof row!=="object"||!["bookingId","bookingRef","serviceId","createdAt","customerTotal"].every(k=>typeof row[k]==="string"&&row[k].length>0)||!bookingStatuses.includes(row.status)||!paymentStatuses.includes(row.paymentStatus)||!["LAUNCH_FREE","COMMISSIONABLE"].includes(row.commercialPath)||row.currency!=="LAK"||!Number.isSafeInteger(row.quantity)||row.quantity<1||!/^\d+$/.test(row.customerTotal)||!Number.isFinite(Date.parse(row.createdAt)))throw new ClientError("INVALID_RESPONSE")}
 return value;
}
