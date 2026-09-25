# Concurrency harness status

A provider-neutral multi-process harness launches two independent psql clients at the same Partner trial ordinal under SERIALIZABLE transactions. Pass condition: exactly one successful commit.

It is intentionally not in normal Website CI because CI has no approved PostgreSQL service/provider. It becomes an integration gate once a disposable PostgreSQL environment is approved.

Still pending real database execution and concrete repository SQL: fifth-vs-sixth allocation, inventory last-unit contention, and persisted idempotent replay.

Do not interpret this harness as a passed concurrency test until it executes against PostgreSQL.
