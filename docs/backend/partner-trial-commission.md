# Partner launch-free period and commission ledger

## Locked business rule
- Each Partner receives **six calendar months commission-free** from that Partner's own commercial activation timestamp.
- The free period does not start at application submission, document upload, verification review, or a global campaign date.
- Commercial activation is an internal ADMIN-only action after final Partner verification is APPROVED.
- Activation changes the Partner business status from DRAFT to ACTIVE and creates the Partner's LAUNCH_FREE commercial terms atomically.
- A Partner cannot activate itself and cannot receive commercial bookings unless verification_status is APPROVED and business_status is ACTIVE.
- At the exact free-period expiry boundary, later eligible transactions require separately accepted commercial terms before commission can apply.
- Commission percentage is not hard-coded here; it comes from the applicable versioned commission rule/category.
- Historical commission snapshots and audit records remain immutable.

## Concurrency invariant
Commercial activation and creation of launch-free terms run in one serializable server transaction. A Partner cannot receive a second launch-free period.

## Commission snapshot
For commissionable bookings persist currency, basis amount, rate in basis points, commission amount, partner amount and commission rule version. Historical snapshots do not change when future commission rules change.

## Still unresolved
Exact commission rates by service category, settlement frequency, invoice/tax treatment and payment-gateway decisions remain configurable until formally approved.
