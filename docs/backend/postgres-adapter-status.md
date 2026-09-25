# PostgreSQL adapter implementation status

Provider-neutral transaction and repository implementations now exist without embedding a database vendor or DATABASE_URL in source code.

Implemented:
- BEGIN / SERIALIZABLE / COMMIT / ROLLBACK transaction adapter with client release.
- persisted booking idempotency claim/read/complete foundation.
- SELECT ... FOR UPDATE availability locking.
- guarded finite inventory decrement and unlimited-inventory handling.
- Partner row lock.
- audit write.

Fail-closed placeholders remain intentionally:
- commercial allocation persistence (five-free-trial vs commissionable);
- booking/price snapshot persistence;
- inventory hold attachment.

These operations throw rather than silently creating a partial booking. Do not enable the production booking endpoint until they are wired and PostgreSQL integration tests pass.

A concrete pool driver is also intentionally not selected yet. The adapter accepts a PgPoolLike interface so provider/driver approval remains a separate infrastructure decision.
