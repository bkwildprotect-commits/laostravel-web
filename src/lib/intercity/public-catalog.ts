import type {Pool} from "pg";

export type IntercityVehicleType="VIP_VAN"|"BUS";
export type IntercityCatalogLocale="en"|"lo"|"th";

export class IntercityCatalogInputError extends Error{
 constructor(public code:"INVALID_DATE"|"INVALID_AREA_CODE"|"INVALID_VEHICLE_TYPE"|"INVALID_LOCALE"|"INVALID_LIMIT"){super(code)}
}

export type IntercityCatalogQuery={
 date:string;
 originAreaCode?:string;
 destinationAreaCode?:string;
 vehicleType?:IntercityVehicleType;
 locale?:IntercityCatalogLocale;
 limit?:number;
};

export type IntercityDesignatedStop={id:string;areaCode:string;name:string;role:"BOARDING"|"DROPOFF"|"BOTH";order:number;latitude:number;longitude:number};

export type PublicIntercityDeparture={
 serviceId:string;
 availabilityId:string;
 partnerName:string;
 serviceName:string;
 vehicleType:IntercityVehicleType;
 origin:{code:string;name:string};
 destination:{code:string;name:string};
 departureAt:string;
 arrivalAt:string|null;
 remainingSeats:number;
 pricing:{currency:"LAK";unitAmount:string;partnerDiscountAmount:string;customerUnitTotal:string};
 designatedStops:IntercityDesignatedStop[];
 pickup:
  |{mode:"SMART_PICKUP_REQUEST";maxDetourMeters:number;requiresOperatorApproval:true}
  |{mode:"DESIGNATED_STOP_ONLY";maxDetourMeters:null;requiresOperatorApproval:false};
};

const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const areaCodePattern=/^[A-Z0-9][A-Z0-9-]{1,31}$/;

export function validateIntercityCatalogQuery(input:Record<string,string|null|undefined>):IntercityCatalogQuery{
 const date=input.date?.trim()??"";
 const parsed=new Date(`${date}T00:00:00.000Z`);
 if(!datePattern.test(date)||Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)
  throw new IntercityCatalogInputError("INVALID_DATE");
 const originAreaCode=input.originAreaCode?.trim()||undefined;
 const destinationAreaCode=input.destinationAreaCode?.trim()||undefined;
 if((originAreaCode&&!areaCodePattern.test(originAreaCode))||(destinationAreaCode&&!areaCodePattern.test(destinationAreaCode)))
  throw new IntercityCatalogInputError("INVALID_AREA_CODE");
 const vehicleTypeRaw=input.vehicleType?.trim()||undefined;
 if(vehicleTypeRaw&&vehicleTypeRaw!=="VIP_VAN"&&vehicleTypeRaw!=="BUS")
  throw new IntercityCatalogInputError("INVALID_VEHICLE_TYPE");
 const vehicleType=vehicleTypeRaw as IntercityVehicleType|undefined;
 const locale=input.locale?.trim()||"en";
 if(locale!=="en"&&locale!=="lo"&&locale!=="th")throw new IntercityCatalogInputError("INVALID_LOCALE");
 const limitRaw=input.limit?.trim();
 const limit=limitRaw===undefined||limitRaw===""?50:Number(limitRaw);
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new IntercityCatalogInputError("INVALID_LIMIT");
 return {date,...(originAreaCode?{originAreaCode}:{}),...(destinationAreaCode?{destinationAreaCode}:{}),...(vehicleType?{vehicleType}:{}),locale,limit};
}

export async function listPublicIntercityDepartures(pool:Pool,input:IntercityCatalogQuery):Promise<PublicIntercityDeparture[]>{
 const result=await pool.query<{
  service_id:string;availability_id:string;partner_name:string;service_name:string;vehicle_type:IntercityVehicleType;
  origin_code:string;origin_name:string;destination_code:string;destination_name:string;
  starts_at:Date;ends_at:Date|null;remaining:number;currency:"LAK";unit_amount:string;partner_discount_amount:string;
  smart_pickup_enabled:boolean;smart_pickup_max_detour_m:number|null;pickup_requires_operator_approval:boolean;
  designated_stops:Array<{id:string;areaCode:string;name:string;role:"BOARDING"|"DROPOFF"|"BOTH";order:number;latitude:string;longitude:string}>;
 }>(`
  SELECT s.id AS service_id,a.id AS availability_id,p.name AS partner_name,
         COALESCE(st.name,s.id::text) AS service_name,sc.vehicle_type,
         origin.code AS origin_code,
         CASE WHEN $5='lo' THEN origin.name_lo ELSE origin.name_en END AS origin_name,
         destination.code AS destination_code,
         CASE WHEN $5='lo' THEN destination.name_lo ELSE destination.name_en END AS destination_name,
         a.starts_at,a.ends_at,a.remaining,price.currency,price.unit_amount::text,
         price.partner_discount_amount::text,sc.smart_pickup_enabled,
         sc.smart_pickup_max_detour_m,sc.pickup_requires_operator_approval,
         stop_list.designated_stops
  FROM services s
  JOIN partners p ON p.id=s.partner_id AND p.verification_status='APPROVED' AND p.business_status='ACTIVE'
  JOIN partner_commercial_terms terms ON terms.partner_id=p.id
    AND ((terms.model='COMMISSION' AND length(btrim(terms.accepted_terms_version))>0) OR (terms.model='LAUNCH_FREE' AND now()<terms.free_ends_at))
  JOIN service_capability_details sc ON sc.service_id=s.id
    AND sc.publication_status='PUBLISHED' AND sc.vehicle_type IN ('VIP_VAN','BUS')
  JOIN service_areas origin ON origin.code=sc.origin_area_code
  JOIN service_areas destination ON destination.code=sc.destination_area_code
  JOIN service_area_assignments assignment ON assignment.service_id=s.id
  JOIN service_areas commercial_area ON commercial_area.code=assignment.area_code
    AND commercial_area.commercial_status='BOOKING_ENABLED'
  JOIN availability a ON a.service_id=s.id
    AND a.starts_at::date=$1::date AND a.starts_at>=now() AND a.remaining IS NOT NULL AND a.remaining>0
  JOIN LATERAL(
    SELECT o.currency,o.unit_amount,o.partner_discount_amount
    FROM service_price_offers o
    WHERE o.service_id=s.id AND o.status='ACTIVE' AND o.effective_from<=now()
      AND (o.effective_until IS NULL OR o.effective_until>now())
    ORDER BY o.effective_from DESC,o.id DESC LIMIT 1
  ) price ON true
  LEFT JOIN LATERAL(
    SELECT t.name FROM service_translations t
    WHERE t.service_id=s.id AND t.locale IN ($5,'en')
    ORDER BY CASE WHEN t.locale=$5 THEN 0 ELSE 1 END LIMIT 1
  ) st ON true
  LEFT JOIN LATERAL(
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',stop.id,'areaCode',stop.area_code,
      'name',CASE WHEN $5='lo' THEN stop.name_lo ELSE stop.name_en END,
      'role',stop.stop_role,'order',stop.stop_order,
      'latitude',stop.latitude::text,'longitude',stop.longitude::text
    ) ORDER BY stop.stop_order),'[]'::jsonb) AS designated_stops
    FROM intercity_designated_stops stop
    WHERE stop.service_id=s.id AND stop.active=true AND stop.verification_status='VERIFIED'
  ) stop_list ON true
  WHERE s.service_kind='INTERCITY_TRANSPORT' AND s.status='ACTIVE'
    AND ($2::text IS NULL OR origin.code=$2)
    AND ($3::text IS NULL OR destination.code=$3)
    AND ($4::text IS NULL OR sc.vehicle_type=$4)
    AND (sc.vehicle_type<>'BUS' OR EXISTS(
      SELECT 1 FROM intercity_designated_stops boarding
      WHERE boarding.service_id=s.id AND boarding.active=true AND boarding.verification_status='VERIFIED'
        AND boarding.stop_role IN ('BOARDING','BOTH')
    ))
  ORDER BY a.starts_at,s.id
  LIMIT $6
 `,[input.date,input.originAreaCode??null,input.destinationAreaCode??null,input.vehicleType??null,input.locale??"en",input.limit??50]);
 return result.rows.map(row=>{
  const discount=BigInt(row.partner_discount_amount),unit=BigInt(row.unit_amount);
  const pickup=row.vehicle_type==="VIP_VAN"&&row.smart_pickup_enabled&&row.smart_pickup_max_detour_m!==null&&row.pickup_requires_operator_approval
   ?{mode:"SMART_PICKUP_REQUEST" as const,maxDetourMeters:row.smart_pickup_max_detour_m,requiresOperatorApproval:true as const}
   :{mode:"DESIGNATED_STOP_ONLY" as const,maxDetourMeters:null,requiresOperatorApproval:false as const};
  return {
   serviceId:row.service_id,availabilityId:row.availability_id,partnerName:row.partner_name,serviceName:row.service_name,
   vehicleType:row.vehicle_type,origin:{code:row.origin_code,name:row.origin_name},
   destination:{code:row.destination_code,name:row.destination_name},departureAt:row.starts_at.toISOString(),
   arrivalAt:row.ends_at?.toISOString()??null,remainingSeats:row.remaining,
   pricing:{currency:row.currency,unitAmount:row.unit_amount,partnerDiscountAmount:row.partner_discount_amount,customerUnitTotal:(unit-discount).toString()},
   designatedStops:row.designated_stops.map(stop=>({...stop,latitude:Number(stop.latitude),longitude:Number(stop.longitude)})),
   pickup,
  };
 });
}
