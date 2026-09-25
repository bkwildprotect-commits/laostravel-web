# Tour lead abuse protection

Production intake requires three independent controls:
1. Idempotency key per form submission. Reuse with the same payload replays or waits; reuse with changed payload is rejected.
2. Server-side rate limiting backed by shared persistent storage. Never rely on process memory in a horizontally scaled deployment.
3. Bot/abuse signals may be added after hosting/provider selection; do not hard-code a vendor yet.

The current helpers define policy only. The tour-lead endpoint remains fail-closed while storage is unconfigured. Before enablement, atomically claim the idempotency key, enforce a privacy-conscious rate-limit key, persist the lead, mark the claim complete, and return success. Raw email/phone must not be used as plaintext rate-limit keys or application logs.
