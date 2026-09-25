# Migration reconciliation 0001-0004

Pre-production order:
1. Base reference schema creates users, partners, services, availability, bookings, payments, rewards and commercial ledgers.
2. 0001 adds booking inventory holds and booking idempotency after verifying base prerequisites.
3. 0002 adds reward integrity without prematurely fixing coupon reuse policy.
4. 0003 adds payment webhook idempotency and unique non-null provider references.
5. 0004 adds partner_booking_commercial_paths and composite foreign keys so a booking cannot be both TRIAL_FREE and COMMISSIONABLE.

Commercial-path integrity is declarative: booking_id is the primary key of partner_booking_commercial_paths. Trial rows are constrained to TRIAL_FREE and commission rows to COMMISSIONABLE, with composite foreign keys including booking_id, partner_id and path. Concurrent transactions therefore cannot establish opposite paths for the same booking.

Important: none of these migrations has been executed against an approved production database. The next verification gate is a disposable PostgreSQL integration environment with real concurrent transactions.

Known deployment rule: if an older migration revision was ever applied to an environment, do not edit its history there; add a forward corrective migration.
