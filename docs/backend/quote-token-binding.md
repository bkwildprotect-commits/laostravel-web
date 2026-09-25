# Quote Token Binding

A booking may only use the availabilityToken and priceQuoteId issued together by the server for the quote being validated.

Before any inventory mutation the server must verify:
- quote is unexpired;
- availabilityToken exactly matches the stored/server-issued quote;
- priceQuoteId exactly matches that same quote;
- serviceId and quantity match;
- date/option/inventory semantics are revalidated by the concrete quote repository before production activation.

Clients cannot construct, swap, or override authoritative token/price bindings. A mismatch fails before inventory hold, trial allocation, commission, or booking creation.
