# Price Snapshot Invariants

Booking price is server-authoritative. The client never supplies or overrides payable money fields.

Before booking commit, the server validates the unexpired price quote and creates an immutable snapshot containing currency, base amount, fees, coupon benefit, points benefit, customer total and priceQuoteId.

Invariant: customerTotal = baseAmount + feesAmount - couponAmount - pointsBenefitAmount, and the result cannot be negative.

Money uses non-negative integer minor-unit strings in application code and bigint-compatible columns in PostgreSQL. Currency is an uppercase ISO-style 3-letter code.

Coupon and points eligibility/amounts must be computed and revalidated server-side. The snapshot preserves the historical values used by the booking even if later pricing, coupon or points rules change.
