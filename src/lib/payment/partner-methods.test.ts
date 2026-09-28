import { describe, expect, it } from "vitest";
import { availablePayAtPartnerMethods, paymentStatusAfterCustomerAction } from "./partner-methods";

describe("pay at partner methods", () => {
  it("shows Lao QR only when the partner offers it and the traveller's app supports it", () => {
    const partnerMethods = ["LAO_QR", "CASH_LAK"] as const;
    expect(availablePayAtPartnerMethods({ partnerMethods, customerQrSupported: false }).map(x => x.method))
      .toEqual(["CASH_LAK"]);
    expect(availablePayAtPartnerMethods({ partnerMethods, customerQrSupported: true }).map(x => x.method))
      .toEqual(["LAO_QR", "CASH_LAK"]);
  });
  it("keeps the charge currency in LAK for every partner method", () => {
    const choices = availablePayAtPartnerMethods({
      partnerMethods: ["LAO_QR", "CARD_AT_PARTNER", "CASH_LAK"], customerQrSupported: true
    });
    expect(choices.every(x => x.chargedCurrency === "LAK" && x.verification === "PARTNER_REQUIRED")).toBe(true);
  });
  it("never marks a customer claim, QR display or uploaded receipt as paid", () => {
    for (const action of ["QR_SHOWN", "METHOD_SELECTED", "RECEIPT_UPLOADED"] as const)
      expect(paymentStatusAfterCustomerAction("PENDING", action)).toBe("PENDING");
  });
});
