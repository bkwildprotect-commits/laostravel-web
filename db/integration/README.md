# PostgreSQL integration tests

These SQL checks are for a disposable PostgreSQL database only. They are not executed against production.

Current checks:
- 001 verifies a booking allocated to TRIAL_FREE cannot also create a commission ledger row.
- 002 verifies occupied Partner trial ordinals 1-5 are unique and a duplicate occupied ordinal is rejected.

Concurrency scenarios still require a real multi-connection harness: two clients racing for the same commercial path, multiple bookings competing for the fifth free ordinal, and inventory decrement under contention. Unit tests cannot prove PostgreSQL locking behavior.

Prerequisite: apply the reconciled base schema and migrations 0001-0004 to the disposable database first. The scripts use gen_random_uuid(), available in supported modern PostgreSQL releases.

Do not mark the database integration gate passed until these scripts and the multi-connection concurrency suite have executed successfully on the approved PostgreSQL environment.
