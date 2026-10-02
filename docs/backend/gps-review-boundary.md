# GPS review activation boundary

The database and repository support auditable location review, but LaosTravel must not expose a location approval mutation route until server-side administrator role verification is connected.

## Ready now
- Partner venue and service meeting-point submissions require authenticated partner membership.
- Partner edits return a pin to PENDING and clear prior verification evidence.
- Pending reviews can be listed by trusted server-side code.
- Review writes use optimistic concurrency (location id + expected updated timestamp) so a reviewer cannot approve stale coordinates.
- VERIFIED/REJECTED decisions record the reviewer and an audit-log event.
- Traveller navigation exposes only verified locations through booking ownership checks.

## Activation prerequisite
An admin review API/UI may call the review repository only after the authentication layer can prove an authenticated internal/admin role server-side. The current admin access helper intentionally fails closed, so bypassing it with a normal authenticated-user check is prohibited.

Do not infer admin authority from partner membership, request JSON, query parameters, client state, local storage, or public environment variables.
