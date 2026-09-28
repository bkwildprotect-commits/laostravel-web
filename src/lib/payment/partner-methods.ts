/** Payment choices are independent of the customer's display currency. */
export type PartnerPaymentMethod = "LAO_QR" | "CASH_LAK" | "CARD_AT_PARTNER";
export type PaymentChoice = {
  method: PartnerPaymentMethod;
  chargedCurrency: "LAK";
  verification: "PARTNER_REQUIRED";
};

export function availablePayAtPartnerMethods(input: {
  partnerMethods: readonly PartnerPaymentMethod[];
  customerQrSupported: boolean;
}): PaymentChoice[] {
  const supported = new Set(input.partnerMethods);
  const methods: PartnerPaymentMethod[] = ["LAO_QR", "CARD_AT_PARTNER", "CASH_LAK"];
  return methods
    .filter(method => supported.has(method) && (method !== "LAO_QR" || input.customerQrSupported))
    .map(method => ({ method, chargedCurrency: "LAK", verification: "PARTNER_REQUIRED" }));
}

/** A customer action is not evidence that a payment reached the partner. */
export function paymentStatusAfterCustomerAction(
  status: "PENDING" | "PAID",
  action: "QR_SHOWN" | "METHOD_SELECTED" | "RECEIPT_UPLOADED"
): "PENDING" | "PAID" {
  void action;
  return status;
}
