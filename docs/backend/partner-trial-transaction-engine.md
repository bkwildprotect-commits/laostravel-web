# Partner Trial Transaction Engine

This layer defines the deterministic decision used inside the future database transaction.

## Decision
1. Lock the Partner trial entitlement scope.
2. Read RESERVED + CONSUMED trial ordinals.
3. Allocate the first available ordinal from 1 through 5.
4. If none is available, classify the booking as COMMISSIONABLE.
5. Persist the decision in the same transaction as booking eligibility.
6. Never accept a client-provided trial/commission classification.

## Lifecycle
- Active qualifying candidate: RESERVED.
- Reaches the approved qualifying completion event: CONSUMED.
- Cancelled before qualification: RELEASED, making that ordinal reusable.
- CONSUMED history is retained and cannot be silently returned to the pool.

## Commission
Commissionable bookings use the active versioned category rule. The exact percentage remains configurable. Calculation uses integer minor units and basis points; the snapshot is immutable for historical accounting.

## Important
The TypeScript module is domain logic, not a substitute for PostgreSQL locking. Real production allocation must use a database transaction and locking/advisory-lock strategy supported by the selected provider.
