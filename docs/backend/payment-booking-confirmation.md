# Payment and Booking Confirmation

Booking confirmation is server-authoritative.

- PAY_NOW: a PENDING booking cannot become CONFIRMED until payment is independently verified as PAID by the server/provider integration. AUTHORIZED alone is not treated as PAID.
- PAY_AT_PARTNER: the booking may be confirmed while payment remains PENDING because the customer pays the Partner directly under the approved booking flow.
- PAY_LATER: may be confirmed without current online payment when the applicable service rule permits it.
- FAILED or CANCELLED PAY_NOW releases an ACTIVE inventory hold through the inventory lifecycle policy.

Client screenshots, client-declared payment status, and unverified callbacks never confirm payment. Concrete gateway verification remains provider-specific and is not implemented until a payment provider is approved.

Payment, booking, inventory, settlement and Partner commission remain separate state machines.
