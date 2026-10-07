import { describe, expect, it } from "vitest";
import { messages } from "./messages";

const thaiScript = /[\u0E00-\u0E7F]/;

describe("Lao localization", () => {
  it("does not fall back to Thai in Lao home or primary navigation copy", () => {
    const lao = messages.lo;
    const visibleCopy = [
      ...Object.values(lao.nav),
      ...Object.values(lao.home).flatMap((value) =>
        Array.isArray(value) ? value : [value],
      ),
      ...lao.services,
    ].join(" ");

    expect(visibleCopy).not.toMatch(thaiScript);
  });

  it("provides Lao-specific home copy instead of English defaults", () => {
    expect(messages.lo.home.heroTitle).not.toBe(messages.en.home.heroTitle);
    expect(messages.lo.home.highlightTitle).not.toBe(messages.en.home.highlightTitle);
    expect(messages.lo.home.packageTitle).not.toBe(messages.en.home.packageTitle);
    expect(messages.lo.nav.home).not.toBe(messages.en.nav.home);
  });
});
