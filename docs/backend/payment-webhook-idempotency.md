# Payment Webhook Idempotency

A provider callback is authenticated and independently verified before business-state mutation. Provider-specific signature verification is intentionally deferred until a gateway is approved.

The server claims (provider,event_id) atomically and stores a payload hash. An unseen event may process once. An identical completed event is replayed with no payment, booking, inventory, trial or commission side effects. Concurrent PROCESSING duplicates stop. Reuse of the same provider/event ID with a different payload hash is a conflict and must not mutate state.

payments.provider_ref is unique when present, providing a second database barrier against recording the same provider transaction twice.

Webhook processing and the resulting payment/booking transition must occur transactionally. Client screenshots and client-declared statuses are never webhook evidence.
