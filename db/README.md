# LaosTravel Database Migrations

This directory is the future ordered PostgreSQL migration history.

Rules:
1. Never edit an already-applied production migration; add a new numbered migration.
2. Production migrations run from a trusted server/CI environment, never the browser.
3. Back up and test restore before destructive migrations.
4. Apply migrations to a non-production environment first.
5. Migration history is recorded in schema_migrations.
6. Provider credentials and DATABASE_URL must never be committed.

0001_core_booking.sql is intentionally fail-closed: it refuses to create safety tables if the required LaosTravel base tables do not exist.
