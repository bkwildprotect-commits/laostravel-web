import type {Pool} from "pg";

export class EmergencyDirectoryInputError extends Error {
  constructor(public code: "INVALID_COORDINATES" | "INVALID_RADIUS") { super(code); }
}

export type NearbyEmergencyEntry = {
  id:string; agencyName:string; agencyType:string; phoneNumber:string;
  locality:string|null; province:string|null; distanceMeters:number;
};

export async function getNearbyVerifiedEmergencyEntries(
  pool:Pool,
  input:{latitude:number;longitude:number;radiusMeters?:number;limit?:number},
):Promise<NearbyEmergencyEntry[]> {
  const {latitude,longitude}=input;
  if(!Number.isFinite(latitude)||latitude < -90||latitude > 90||!Number.isFinite(longitude)||longitude < -180||longitude > 180)
    throw new EmergencyDirectoryInputError("INVALID_COORDINATES");
  const radius=input.radiusMeters ?? 50000;
  if(!Number.isInteger(radius)||radius < 1000||radius > 100000) throw new EmergencyDirectoryInputError("INVALID_RADIUS");
  const limit=Math.min(Math.max(input.limit ?? 12,1),25);
  const result=await pool.query<{
    id:string;agency_name:string;agency_type:string;phone_number:string;locality:string|null;province:string|null;distance_m:number|string;
  }>(`
    WITH candidates AS (
      SELECT id,agency_name,agency_type,phone_number,locality,province,
        6371000 * 2 * asin(sqrt(
          power(sin(radians(latitude::double precision - $1) / 2),2) +
          cos(radians($1)) * cos(radians(latitude::double precision)) *
          power(sin(radians(longitude::double precision - $2) / 2),2)
        )) AS distance_m
      FROM emergency_directory_entries
      WHERE active=true AND is_verified=true AND is_national=false
        AND latitude IS NOT NULL AND longitude IS NOT NULL
    )
    SELECT * FROM candidates WHERE distance_m <= $3 ORDER BY distance_m ASC, agency_name ASC LIMIT $4
  `,[latitude,longitude,radius,limit]);
  return result.rows.map(row=>({
    id:row.id,agencyName:row.agency_name,agencyType:row.agency_type,phoneNumber:row.phone_number,
    locality:row.locality,province:row.province,distanceMeters:Math.round(Number(row.distance_m)),
  }));
}
