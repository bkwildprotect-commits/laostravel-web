# Legacy `TRIAL_FREE` booking lifecycle — compatibility only

This document describes the historical five-free-booking ordinal model. It is retained only to explain and safely process legacy `partner_trial_ledger` rows. It is not the current LaosTravel commercial policy.

## Current v2 rule for new bookings

New bookings use `partner_commercial_terms`, not trial ordinals:

- An eligible Partner receives an individual six-calendar-month `LAUNCH_FREE` period beginning only at audited commercial activation after APPROVED verification and a ready, bookable service in an open area.
- Booking count does not consume or shorten that period.
- Expiry does not silently activate commission. Separately accepted `COMMISSION` terms and an active effective versioned rule are required.
- Commission qualification requires `COMPLETED + PAID` and accepted terms evidence.

## Historical compatibility behavior

For an existing legacy booking that already has a RESERVED `partner_trial_ledger` row:

- COMPLETED consumes the reserved legacy ordinal.
- CANCELLED, EXPIRED or NO_SHOW releases the reserved legacy ordinal.
- A consumed legacy ordinal is not silently reopened.
- A legacy booking cannot simultaneously have a `TRIAL_FREE` path and a commission ledger.

This compatibility path must not create new `TRIAL_FREE` bookings or determine current Partner launch-free eligibility. New v2 commercial decisions remain server-authoritative and transactional.
