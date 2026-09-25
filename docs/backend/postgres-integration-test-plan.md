# PostgreSQL integration test gate

Required before production database approval:

1. Bootstrap a disposable PostgreSQL environment from the reconciled schema and migrations 0001-0004.
2. Run commercial-path and trial-ordinal SQL integrity checks.
3. Run two or more independent database connections concurrently.
4. Prove exactly five occupied free-trial ordinals per Partner; released ordinals may become available again according to server allocation policy.
5. Prove booking #6 is allocated COMMISSIONABLE only after all five free ordinals are occupied/consumed.
6. Prove one booking cannot become both TRIAL_FREE and COMMISSIONABLE.
7. Prove finite inventory cannot fall below zero when concurrent requests compete for the last units.
8. Prove duplicate idempotency keys cannot create multiple bookings.
9. Verify CANCELLED, EXPIRED and NO_SHOW release a RESERVED trial slot; COMPLETED consumes it.
10. Keep commissionable NO_SHOW behavior unasserted until the business rule is decided.

Pass criteria: no invariant violation, no negative inventory, no sixth free occupied trial, no duplicate booking, and no dual commercial path.
