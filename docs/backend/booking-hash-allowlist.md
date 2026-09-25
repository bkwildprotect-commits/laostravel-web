# Booking Hash Allow-list

The idempotency request hash must be derived only from approved booking semantics, never from the entire raw HTTP body.

Current allow-list:
serviceId, availabilityToken, priceQuoteId, quantity, traveller name/email, optional couponCode, optional pointsToRedeem.

Normalization:
- traveller name is trimmed;
- email is trimmed and lower-cased;
- coupon code is trimmed and upper-cased.

The idempotency key itself is excluded from the hash. Authentication tokens, passwords, payment credentials, identity documents, headers and unrelated client metadata are excluded.

When the booking contract gains a semantic field such as date/option, the allow-list and its tests must be updated deliberately.
