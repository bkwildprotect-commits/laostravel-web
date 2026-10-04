import {describe,it,expect,vi} from "vitest";
import {EmergencyDirectoryInputError,getNearbyVerifiedEmergencyEntries} from "./postgres-emergency-directory";

describe("verified emergency directory",()=>{
  it("rejects invalid coordinates before querying",async()=>{
    const pool={query:vi.fn()};
    await expect(getNearbyVerifiedEmergencyEntries(pool as never,{latitude:91,longitude:102})).rejects.toBeInstanceOf(EmergencyDirectoryInputError);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("returns only repository query results with rounded distance",async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[{id:"e1",agency_name:"Rescue",agency_type:"RESCUE",phone_number:"123",locality:"Vang Vieng",province:"Vientiane",distance_m:"1250.4"}]})};
    await expect(getNearbyVerifiedEmergencyEntries(pool as never,{latitude:18.9,longitude:102.4})).resolves.toEqual([{id:"e1",agencyName:"Rescue",agencyType:"RESCUE",phoneNumber:"123",locality:"Vang Vieng",province:"Vientiane",distanceMeters:1250}]);
    expect(pool.query).toHaveBeenCalledOnce();
  });
});
