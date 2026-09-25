# Multi-connection concurrency harness

This directory contains transaction workers launched concurrently against a disposable PostgreSQL integration database.

The trial worker performs real writes under SERIALIZABLE isolation. Two workers targeting the same Partner and ordinal must not both commit. A future concrete booking repository must allocate ordinals under a Partner allocation lock; this worker verifies the database backstop only.

Inventory contention is not claimed yet because the current schema has availability.remaining but no concrete PostgreSQL repository statement defining the atomic decrement/lock protocol. Add that SQL with the concrete repository rather than inventing production behavior.

Run only after the base schema and migrations 0001-0004. Never point this harness at production.
