# Migration Strategy

The current database-schema.sql remains the architecture/reference schema. Production rollout will use ordered migrations under db/migrations.

## Environments
Local/test -> staging -> production. A migration must pass automated schema and booking-concurrency tests before production.

## Safety
- Forward-only numbered migrations by default.
- No secrets in SQL or Git.
- Destructive changes require backup, restore test, explicit owner approval, and a separate migration.
- schema_migrations records applied versions.
- Application startup/health checks should detect an incompatible schema version and fail closed for writes.

## Next prerequisite
Before executing migrations, LaosTravel still needs an approved PostgreSQL provider, secure server-side connection, and a concrete transaction adapter.
