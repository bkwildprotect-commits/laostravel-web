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

## Bootstrap paths

The repository has two distinct bootstrap paths; their migration cutoffs are not interchangeable.

- **Disposable integration bootstrap:** The integration verification described by the existing test setup applies and verifies ordered migrations through `0029_partner_application_intake`, including Partner final verification requirements, booking-scoped chat/translation storage, explicit SOS location consent, and authenticated Partner application intake. This cutoff describes that integration test path.
- **Provider Staging bootstrap plan:** `scripts/staging-bootstrap.mjs --plan` builds an offline, approval-bound plan from `docs/backend/database-schema.sql`, every SQL migration in `db/migrations/` (currently 36 files through the `0034` series, including both `0025_*` files and both `0027_*` files), and `db/staging/client-isolation.sql`. The current plan therefore contains 38 units. The script verifies the manifest and SHA-256 checksums and validates the Staging target/TLS before any database connection in check/apply modes.

The provider Staging runner defaults to an offline plan. Do not run `--apply` or apply real migrations without the separate, exact-plan owner approval required by the script. This documentation clarification does not authorize database changes.
