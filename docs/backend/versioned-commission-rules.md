# Versioned commission rules

Commission remains disabled by default after the five qualifying free bookings. Migration 0018 creates the authoritative rule registry but seeds no percentage.

An ACTIVE rule is eligible only inside its effective window. Booking allocation snapshots its immutable `version`; historical bookings must never be repriced when a future rule changes.

Until LaosTravel formally approves an exact rate, there is no ACTIVE rule and the sixth commissionable booking fails closed with `COMMISSION_RULE_NOT_CONFIGURED`. This is intentional: code must not invent a percentage.

Activation requires a separately approved operational path that records the rate in basis points, effective dates and creator. Settlement frequency and Lao tax/invoice treatment remain separate decisions.
