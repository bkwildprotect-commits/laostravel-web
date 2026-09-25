# Booking Idempotency Request Hash

Booking idempotency compares a client key with a server-generated SHA-256 hash of a canonical booking payload.

Rules:
- The server computes the hash; clients do not provide an authoritative request hash.
- Object keys are canonicalized before hashing so JSON key order does not create false conflicts.
- A semantic booking change (for example quantity, service, option, date, traveller, quote) changes the hash.
- Secrets, access tokens, raw payment credentials and uploaded identity documents must never be included in the canonical payload.
- The concrete booking endpoint will define the exact allow-listed fields before production activation.
- Same user + same idempotency key + same hash may replay the original result.
- Same user + same key + different hash is a conflict.
