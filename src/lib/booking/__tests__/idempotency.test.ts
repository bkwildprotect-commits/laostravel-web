import {describe,it,expect} from "vitest";import {decideIdempotency,type IdempotencyRecord} from "../idempotency";
const base:IdempotencyRecord={key:"key-123456",userId:"u1",requestHash:"hash-a",status:"PROCESSING",expiresAt:"2099-01-01T00:00:00Z"};
describe("booking idempotency",()=>{
 it("creates when key is new",()=>expect(decideIdempotency(undefined,"u1","hash-a")).toBe("CREATE"));
 it("blocks concurrent duplicate",()=>expect(decideIdempotency(base,"u1","hash-a")).toBe("IN_PROGRESS"));
 it("replays completed identical request",()=>expect(decideIdempotency({...base,status:"COMPLETED"},"u1","hash-a")).toBe("REPLAY"));
 it("conflicts on changed request",()=>expect(decideIdempotency(base,"u1","hash-b")).toBe("CONFLICT"));
});
