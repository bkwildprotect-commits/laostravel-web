import { describe, expect, it } from "vitest";
import { indicativeDisplayQuote, type IndicativeRate } from "./indicative-currency";
const now = new Date("2026-09-29T00:00:00Z");
const rate: IndicativeRate = {
  currency: "KRW", numerator: "3", denominator: "2000",
  source: "test-bank-feed", observedAt: "2026-09-28T23:55:00Z"
};
describe("indicative currency display", () => {
  it("converts for display without changing the authoritative LAK amount", () => {
    expect(indicativeDisplayQuote({ lakAmount: "800000", currency: "KRW", rate, now }))
      .toEqual({ sourceCurrency: "LAK", sourceAmount: "800000",
        displayedCurrency: "KRW", displayedAmount: "1200", approximate: true,
        rateSource: "test-bank-feed", rateObservedAt: rate.observedAt });
  });
  it("falls back to LAK if the rate is stale, missing, future dated or for another currency", () => {
    for (const unusable of [
      undefined,
      { ...rate, observedAt: "2026-09-28T23:40:00Z" },
      { ...rate, observedAt: "2026-09-29T00:01:00Z" },
      { ...rate, currency: "JPY" as const }
    ]) {
      expect(indicativeDisplayQuote({ lakAmount: "800000", currency: "KRW", rate: unusable, now }))
        .toMatchObject({ sourceAmount: "800000", displayedCurrency: "LAK",
          displayedAmount: "800000", approximate: false });
    }
  });
  it("keeps currency independent of user language and handles large integer amounts", () => {
    const yen = { ...rate, currency: "JPY" as const, numerator: "1", denominator: "1000" };
    expect(indicativeDisplayQuote({ lakAmount: "9007199254740993", currency: "JPY", rate: yen, now }).displayedAmount)
      .toBe("9007199254741");
  });
  it("rejects invalid amount and invalid rate denominator", () => {
    expect(() => indicativeDisplayQuote({ lakAmount: "-5", currency: "LAK", now })).toThrow("INVALID_LAK_AMOUNT");
    expect(indicativeDisplayQuote({ lakAmount: "500", currency: "KRW",
      rate: { ...rate, denominator: "0" }, now }).displayedCurrency).toBe("LAK");
  });
});
