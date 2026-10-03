# Production MVP Readiness Gates

LaosTravel should not recruit public customers until these gates pass.

## Booking core
- Real PostgreSQL transaction adapter connected.
- Authenticated server user context.
- Server quote and price verification.
- Inventory concurrency tests pass.
- Idempotency replay returns the original booking.
- Per-Partner six-calendar-month launch-free period is persisted transactionally and starts only at approved commercial activation.
- Launch bookings use PAY_AT_PARTNER; LaosTravel does not hold customer funds in this mode.
- Partner list price and Partner-funded discount are server-authoritative and snapshotted at booking.
- Commission rules are versioned and server-authoritative, but free-period expiry never activates commission without separately accepted commercial terms.

## Partner/Admin
- Partner verification workflow is operational.
- Admin access uses real server-side roles.
- Emergency contacts are verified before publication.
- Audit logs exist for sensitive operational actions.

## Client quality
- Website and mobile share the same API/data.
- Main Traveller and Partner flows pass end-to-end tests.
- No dead controls or fake production listings.
- Final visual assets replace placeholder emoji/gradients.
- Seven-language localization QA is completed before public launch.

Future features are excluded from these gates unless separately promoted into the MVP.
