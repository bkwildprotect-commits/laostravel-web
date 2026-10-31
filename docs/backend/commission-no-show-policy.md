# NO_SHOW behavior — legacy compatibility and v2 commission boundary

## Legacy `TRIAL_FREE` compatibility

For a historical five-booking trial record with a RESERVED ordinal, NO_SHOW releases that legacy ordinal. This behavior exists only to preserve old `partner_trial_ledger` records; it does not affect the current six-calendar-month Partner entitlement.

## Current v2 commission boundary

A new commission ledger can earn only when all v2 requirements hold: booking `COMPLETED`, payment `PAID`, and nonblank accepted commercial-terms evidence with an active effective versioned rule. A `NO_SHOW` booking is not `COMPLETED` and therefore cannot earn commission.

Current lifecycle logic does not automatically mark a pending commission ledger EARNED or VOID solely because the booking becomes NO_SHOW. The pending ledger remains unchanged pending any separately approved disposition rule; do not invent an earn, void, fee or settlement policy.

NO_SHOW does not qualify for automatic inventory restoration. Any finer service-category cutoff, partial-use treatment or compensation rule remains an owner decision.
