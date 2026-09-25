# Five free booking allocation

The PostgreSQL repository now determines the commercial path while the Partner row is locked in the same SERIALIZABLE transaction.

Occupied trial slots are only RESERVED or CONSUMED. RELEASED rows do not occupy an ordinal, so CANCELLED, EXPIRED and NO_SHOW trial bookings can return their reserved slot according to the lifecycle policy.

Allocation selects the lowest free ordinal from 1 through 5. When all five are occupied, the next booking is COMMISSIONABLE.

The commission percentage is deliberately not hard-coded. The repository returns ruleVersion UNRESOLVED as a fail-closed marker until an approved versioned commission rule is supplied. Booking/commission persistence must reject this marker rather than invent a rate.

The allocation decision alone does not persist a ledger row yet; booking persistence must atomically insert partner_booking_commercial_paths and the corresponding trial or commission ledger entry before production enablement.
