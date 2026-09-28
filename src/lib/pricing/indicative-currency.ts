/** Display-only conversion. Booking, commission and settlement amounts remain in LAK. */
export const displayCurrencies = ["LAK", "KRW", "JPY", "THB", "USD", "CNY", "EUR", "VND"] as const;
export type DisplayCurrency = (typeof displayCurrencies)[number];
export type IndicativeRate = {
  currency: Exclude<DisplayCurrency, "LAK">;
  /** Target currency minor units per LAK unit, represented exactly as a fraction. */
  numerator: string;
  denominator: string;
  source: string;
  observedAt: string;
};
export type DisplayQuote = {
  sourceCurrency: "LAK";
  sourceAmount: string;
  displayedCurrency: DisplayCurrency;
  displayedAmount: string;
  approximate: boolean;
  rateSource?: string;
  rateObservedAt?: string;
};
const MAX_RATE_AGE_MS = 15 * 60 * 1000;
const digits = (value: string) => /^\d+$/.test(value);
function validRate(rate: IndicativeRate, currency: DisplayCurrency, now: Date): boolean {
  const observed = Date.parse(rate.observedAt);
  return rate.currency === currency && digits(rate.numerator) && digits(rate.denominator) &&
    BigInt(rate.numerator) > 0n && BigInt(rate.denominator) > 0n &&
    rate.source.trim().length > 0 && Number.isFinite(observed) &&
    observed <= now.getTime() && now.getTime() - observed <= MAX_RATE_AGE_MS;
}
/** Values are integer minor units. LAK has no decimals; display formatting is a separate concern. */
export function indicativeDisplayQuote(input: {
  lakAmount: string;
  currency: DisplayCurrency;
  rate?: IndicativeRate;
  now: Date;
}): DisplayQuote {
  if (!digits(input.lakAmount)) throw new Error("INVALID_LAK_AMOUNT");
  if (!displayCurrencies.includes(input.currency)) throw new Error("UNSUPPORTED_DISPLAY_CURRENCY");
  const source = { sourceCurrency: "LAK" as const, sourceAmount: input.lakAmount };
  if (input.currency === "LAK" || !input.rate || !validRate(input.rate, input.currency, input.now))
    return { ...source, displayedCurrency: "LAK", displayedAmount: input.lakAmount, approximate: false };
  const amount = BigInt(input.lakAmount);
  const numerator = BigInt(input.rate.numerator);
  const denominator = BigInt(input.rate.denominator);
  const roundedMinor = (amount * numerator + denominator / 2n) / denominator;
  return {
    ...source, displayedCurrency: input.currency, displayedAmount: roundedMinor.toString(),
    approximate: true, rateSource: input.rate.source, rateObservedAt: input.rate.observedAt
  };
}
