import {describe,it,expect} from "vitest";import {deriveRateLimitKey} from "../rate-limit-key";
describe("privacy-safe rate limit key",()=>{
 it("is deterministic without exposing the identifier",async()=>{const secret="0123456789abcdef0123456789abcdef";const identifier="person@example.com";const a=await deriveRateLimitKey({namespace:"tour-lead",identifier,secret});const b=await deriveRateLimitKey({namespace:"tour-lead",identifier,secret});expect(a).toBe(b);expect(a.startsWith("tour-lead:")).toBe(true);expect(a).not.toContain(identifier)});
 it("separates namespaces",async()=>{const secret="0123456789abcdef0123456789abcdef";const a=await deriveRateLimitKey({namespace:"tour-lead",identifier:"same",secret});const b=await deriveRateLimitKey({namespace:"booking",identifier:"same",secret});expect(a).not.toBe(b)});
 it("rejects weak secrets",async()=>{await expect(deriveRateLimitKey({namespace:"tour-lead",identifier:"id",secret:"short"})).rejects.toThrow("INVALID_RATE_LIMIT_KEY_INPUT")});
});
