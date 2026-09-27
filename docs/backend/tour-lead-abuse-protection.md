# Tour lead abuse protection

Production intake requires three independent controls:
1. Idempotency key per form submission. Reuse with the same payload replays or waits; reuse with changed payload is rejected.
2. Server-side rate limiting backed by shared persistent storage. Never rely on process memory in a horizontally scaled deployment.
3. Bot/abuse signals may be added after hosting/provider selection; do not hard-code a vendor yet.

The current helpers define policy only. The tour-lead endpoint remains fail-closed while storage is unconfigured. Before enablement, atomically claim the idempotency key, enforce a privacy-conscious rate-limit key, persist the lead, mark the claim complete, and return success. Raw email/phone must not be used as plaintext rate-limit keys or application logs.

## Privacy-safe rate-limit key contract

Rate-limit identifiers must be derived with HMAC-SHA-256 using a server-only secret of at least 32 characters and a namespace. Raw email, phone, account identifiers, or equivalent personal identifiers must never be persisted as rate-limit keys.

The HMAC helper and regression tests are implemented, but this does **not** mean production rate limiting is enabled. Enablement still requires approved shared durable storage and atomic enforcement across application instances. The production endpoint must remain fail-closed until those dependencies are configured and tested.

## Production enablement checklist

Do not set `TOUR_LEAD_API_APPROVED=true` until all of the following are true:
- approved durable lead storage is configured and integration-tested; the readiness gate requires `DATABASE_URL`, but presence of that variable alone does not prove the lead-storage schema or persistence path is ready;
- shared persistent rate limiting is configured and enforced atomically across application instances;
- `TOUR_LEAD_RATE_LIMIT_SECRET` is a server-only secret with at least 32 characters and is not exposed to browser code or logs;
- durable idempotency claim/replay/conflict handling is implemented and tested;
- failure paths remain fail-closed and do not report success before persistence completes;
- operational logging avoids raw email, phone, and other personal identifiers.

The approval flag is the final operational switch, not a substitute for these controls.
