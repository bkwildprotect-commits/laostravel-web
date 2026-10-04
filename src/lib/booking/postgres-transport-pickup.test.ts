import {describe,expect,it,vi} from "vitest";
import {PostgresBookingRepository} from "./postgres-repository";

describe("transport pickup booking guard",()=>{
 it("requires a designated stop for every Bus booking",async()=>{
  const tx={query:vi.fn().mockResolvedValueOnce([{service_kind:"INTERCITY_TRANSPORT",vehicle_type:"BUS"}])};
  await expect(new PostgresBookingRepository().resolveTransportPickupSelection(tx as never,{serviceId:"service-1"}))
   .rejects.toMatchObject({code:"BUS_DESIGNATED_STOP_REQUIRED",httpStatus:409});
 });
 it("rejects a designated stop on VIP Van because Smart Pickup is a separate request",async()=>{
  const tx={query:vi.fn().mockResolvedValueOnce([{service_kind:"INTERCITY_TRANSPORT",vehicle_type:"VIP_VAN"}])};
  await expect(new PostgresBookingRepository().resolveTransportPickupSelection(tx as never,{serviceId:"service-1",designatedStopId:"stop-1"}))
   .rejects.toMatchObject({code:"DESIGNATED_STOP_NOT_ALLOWED",httpStatus:409});
 });
 it("resolves only an active verified boarding stop and persists an immutable snapshot",async()=>{
  const tx={
   query:vi.fn()
    .mockResolvedValueOnce([{service_kind:"INTERCITY_TRANSPORT",vehicle_type:"BUS"}])
    .mockResolvedValueOnce([{id:"stop-1",area_code:"LA-VTE-VV",name_lo:"ຄິວລົດ",name_en:"Bus Station",stop_role:"BOARDING",stop_order:0,latitude:"18.923700",longitude:"102.447800"}]),
   execute:vi.fn().mockResolvedValue({rowCount:1}),
  };
  const repo=new PostgresBookingRepository();
  const selection=await repo.resolveTransportPickupSelection(tx as never,{serviceId:"service-1",designatedStopId:"stop-1"});
  expect(selection).toMatchObject({mode:"BUS_DESIGNATED_STOP",stop:{id:"stop-1",role:"BOARDING"}});
  expect(tx.query.mock.calls[1][0]).toContain("verification_status='VERIFIED'");
  await repo.persistTransportPickupSelection(tx as never,{bookingId:"booking-1",serviceId:"service-1",selection});
  expect(tx.execute).toHaveBeenCalledWith(expect.stringContaining("booking_designated_stop_snapshots"),expect.arrayContaining(["booking-1","service-1","stop-1"]));
 });
});
