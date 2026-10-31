# Legacy five-booking trial transaction engine — compatibility only

This document describes the historical `TRIAL_FREE` ordinal allocator. It is retained for legacy data and migration-history context; it must not be used for new v2 booking eligibility.

## Current v2 commercial allocation

New booking allocation locks the Partner commercial-terms row and reads `partner_commercial_terms`:

1. An unexpired `LAUNCH_FREE` term qualifies the booking for zero commission during that Partner's individual six-calendar-month window.
2. After expiry, allocation fails closed unless the Partner has separately accepted a `COMMISSION` term and an active effective versioned commission rule exists.
3. The server snapshots the selected path, rule version, accepted terms version and authoritative price in the booking transaction.
4. Booking count never consumes the six-month entitlement.

## Legacy compatibility only

The old ordinal allocator reserves one of five historical `TRIAL_FREE` slots, releases an unqualified reservation and preserves consumed history. It may be used only to interpret or transition existing legacy rows. It must not allocate new bookings or make booking six commissionable.

The TypeScript domain logic is not a substitute for PostgreSQL transaction/locking behavior. Current v2 allocation and ledger persistence must remain inside the authoritative server transaction.
