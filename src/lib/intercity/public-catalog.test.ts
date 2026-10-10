import {describe,expect,it,vi} from "vitest";
import {IntercityCatalogInputError,listPublicIntercityDepartures,validateIntercityCatalogQuery} from "./public-catalog";

describe("public intercity catalog",()=>{
 it("validates stable Mobile query parameters",()=>{
  expect(validateIntercityCatalogQuery({date:"2026-10-16",originAreaCode:"LA-VTE-VV",destinationAreaCode:null,vehicleType:"VIP_VAN",locale:"lo",limit:"20"})).toEqual({
   date:"2026-10-16",originAreaCode:"LA-VTE-VV",vehicleType:"VIP_VAN",locale:"lo",limit:20,
  });
  expect(()=>validateIntercityCatalogQuery({date:"2026-02-30"})).toThrow(IntercityCatalogInputError);
  expect(()=>validateIntercityCatalogQuery({date:"2026-10-16",vehicleType:"CAR"})).toThrow(IntercityCatalogInputError);
  expect(()=>validateIntercityCatalogQuery({date:"2026-10-16",limit:"101"})).toThrow(IntercityCatalogInputError);
 });
 it("returns server-owned seats, price and VIP Van pickup policy",async()=>{
  const pool={query:vi.fn().mockResolvedValue({rows:[{
   service_id:"service-1",availability_id:"availability-1",partner_name:"Verified Van",service_name:"Vang Vieng Express",
   vehicle_type:"VIP_VAN",origin_code:"LA-VTE-VV",origin_name:"ວັງວຽງ",destination_code:"LA-VTE",destination_name:"ວຽງຈັນ",
   starts_at:new Date("2026-10-16T01:00:00Z"),ends_at:new Date("2026-10-16T03:00:00Z"),remaining:7,
   currency:"LAK",unit_amount:"150000",partner_discount_amount:"10000",smart_pickup_enabled:true,
   smart_pickup_max_detour_m:3000,pickup_requires_operator_approval:true,designated_stops:[],
  }]})};
  await expect(listPublicIntercityDepartures(pool as never,{date:"2026-10-16",locale:"lo"})).resolves.toEqual([{
   serviceId:"service-1",availabilityId:"availability-1",partnerName:"Verified Van",serviceName:"Vang Vieng Express",
   vehicleType:"VIP_VAN",origin:{code:"LA-VTE-VV",name:"ວັງວຽງ"},destination:{code:"LA-VTE",name:"ວຽງຈັນ"},
   departureAt:"2026-10-16T01:00:00.000Z",arrivalAt:"2026-10-16T03:00:00.000Z",remainingSeats:7,
   pricing:{currency:"LAK",unitAmount:"150000",partnerDiscountAmount:"10000",customerUnitTotal:"140000"},
   designatedStops:[],
   pickup:{mode:"SMART_PICKUP_REQUEST",maxDetourMeters:3000,requiresOperatorApproval:true},
  }]);
  const sql=pool.query.mock.calls[0][0] as string;
  expect(sql).toContain("p.verification_status='APPROVED'");
  expect(sql).toContain("commercial_area.commercial_status='BOOKING_ENABLED'");
  expect(sql).toContain("a.remaining IS NOT NULL");
  expect(sql).toContain("stop.verification_status='VERIFIED'");
  expect(sql).toContain("p.business_status='ACTIVE'");
  expect(sql).toContain("s.status='ACTIVE'");
  expect(sql).toContain("boarding.stop_role IN ('BOARDING','BOTH')");
 });
 it("never exposes Smart Pickup for a Bus",async()=>{
  const pool={query:vi.fn().mockResolvedValue({rows:[{
   service_id:"service-2",availability_id:"availability-2",partner_name:"Verified Bus",service_name:"North Bus",
   vehicle_type:"BUS",origin_code:"LA-VTE-VV",origin_name:"Vang Vieng",destination_code:"LA-LPB",destination_name:"Luang Prabang",
   starts_at:new Date("2026-10-16T02:00:00Z"),ends_at:null,remaining:20,currency:"LAK",unit_amount:"200000",
   partner_discount_amount:"0",smart_pickup_enabled:false,smart_pickup_max_detour_m:null,pickup_requires_operator_approval:true,
   designated_stops:[{id:"stop-1",areaCode:"LA-VTE-VV",name:"Vang Vieng Bus Station",role:"BOARDING",order:0,latitude:"18.923700",longitude:"102.447800"}],
  }]})};
  const [departure]=await listPublicIntercityDepartures(pool as never,{date:"2026-10-16",vehicleType:"BUS"});
  expect(departure.pickup).toEqual({mode:"DESIGNATED_STOP_ONLY",maxDetourMeters:null,requiresOperatorApproval:false});
  expect(departure.designatedStops).toEqual([{id:"stop-1",areaCode:"LA-VTE-VV",name:"Vang Vieng Bus Station",role:"BOARDING",order:0,latitude:18.9237,longitude:102.4478}]);
 });
});
