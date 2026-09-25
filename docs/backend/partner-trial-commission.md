# Partner 5-Free-Booking Trial + Commission Ledger

## Locked business rule
- Each newly eligible Partner receives **5 qualifying completed bookings** with zero LaosTravel commission.
- Trial usage is determined by qualifying bookings, not by button clicks or abandoned/cancelled bookings.
- A booking may reserve a trial ordinal (1-5) while active so concurrent bookings cannot consume the same slot.
- When that booking reaches the qualifying completion event, the reservation becomes CONSUMED.
- If it is cancelled before qualifying, the reservation becomes RELEASED and the free entitlement becomes available again.
- After all five ordinals are CONSUMED, later qualifying bookings are commissionable.
- Commission percentage is NOT hard-coded here. It comes from the applicable versioned commission rule/category.
- Pay-at-partner means the customer pays the Partner according to the booking/payment requirement; LaosTravel commission is recorded as a separate Partner liability/ledger entry.
- Every decision must be auditable by booking ID and rule version.

## Concurrency invariant
Trial allocation must run in the same server transaction/lock scope used for booking eligibility. Two simultaneous bookings must never receive the same Partner trial ordinal.

## Cancellation
A cancelled trial booking that has not qualified releases its reserved ordinal. Historical ledger rows are retained; they are never silently deleted.

## Commission snapshot
For commissionable bookings persist currency, basis amount, rate in basis points, commission amount, partner amount and commission rule version. Historical snapshots do not change when future commission rules change.

## Still unresolved
Exact commission rates by service category, settlement frequency, invoice/tax treatment and the precise qualifying completion event remain configurable until formally approved.
