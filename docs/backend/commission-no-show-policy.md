# Commission NO_SHOW Policy

## Current locked behavior
For the Partner five-free-booking trial, NO_SHOW does not consume a free booking; a RESERVED ordinal is released.

## Commissionable bookings after the free trial
The business rule for whether a NO_SHOW booking earns, partially earns, or voids LaosTravel commission is intentionally **not decided yet**.

Until the owner approves that policy:
- the domain layer returns no commission transition for NO_SHOW;
- the server must not automatically mark commission EARNED or VOID solely because a booking becomes NO_SHOW;
- future implementation must use a versioned rule and preserve an audit trail.

This prevents an unresolved business decision from being silently hard-coded.
