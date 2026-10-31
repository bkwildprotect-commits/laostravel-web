# PostgreSQL integration tests

These SQL checks run only against a disposable PostgreSQL database created by CI. They are not executed against Supabase Provider Staging or Production.

## Current v2 mutation coverage

`production-mutations.test.ts` exercises current v2 PostgreSQL mutations, including six-calendar-month Partner activation, eligibility prerequisites, quote-to-booking, concurrent inventory protection, idempotent replay, payment/commission qualification, refund/dispute behavior, settlement concurrency, rewards and audit mutations.

The Database Integration workflow also runs the repository bootstrap manifest, RLS/client-isolation assertions and the multi-connection concurrency harness. A passing disposable CI run is not proof of live Provider Staging, Auth/SMS, private Storage or real-device connectivity.

## Legacy `TRIAL_FREE` compatibility SQL

- `001_commercial_path.sql`: rejects simultaneous legacy `TRIAL_FREE` and commission paths.
- `002_trial_ordinals.sql`: preserves uniqueness of historical five-booking trial ordinals.
- `007_booking_trial_e2e.sql`: legacy trial/inventory lifecycle regression.
- `008_booking_trial_rollback.sql`: legacy trial rollback plus separate commission rollback regression.

These files preserve compatibility for historical `TRIAL_FREE` records. They do not define current Partner eligibility, do not allocate new v2 bookings, and do not supersede the six-calendar-month `LAUNCH_FREE` policy in Shared Product Contract v2.

## Safety boundary

The local bootstrap runner accepts only the empty disposable `laostravel_test` database with `RUN_DB_BOOTSTRAP_TESTS=1`. Never point it at Supabase Provider Staging or Production.
