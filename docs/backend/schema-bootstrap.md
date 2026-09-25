# Database bootstrap contract

`docs/backend/database-schema.sql` is the desired-state reference schema and may be used to create a fresh disposable database.

Migrations 0001-0004 are forward/reconciliation migrations. They are written so that applying them after the current desired-state reference schema does not fail merely because a later column, index, table or named constraint already exists.

Rules:
1. Production changes use ordered migrations recorded in `schema_migrations`.
2. The reference schema documents the current end state; it is not a substitute for migration history.
3. Disposable bootstrap verification must test both: reference schema alone, and base/prerequisites plus ordered migrations.
4. Never revise an already-applied production migration; add a new forward migration instead.
5. No migration in this repository has been asserted as production-applied yet.

0002 and 0004 explicitly inspect PostgreSQL catalog constraints before adding named constraints. 0004 also backfills commercial_path before enforcing NOT NULL.
