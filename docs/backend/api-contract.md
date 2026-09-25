# LaosTravel Shared API Contract — Foundation

Website, Android and iOS are clients of one shared backend. Clients never authoritatively decide inventory, final price, booking status, rewards balance, commission or payment state.

## Public reads
- GET /v1/services?category=&area=&locale=
- GET /v1/services/{serviceId}?locale=
- POST /v1/availability/quote
- GET /v1/emergency-contacts?area=

## Authenticated traveller
- POST /v1/bookings with Idempotency-Key
- GET /v1/me/bookings
- GET /v1/me/saved
- GET /v1/me/coupons
- GET /v1/me/points-ledger
- POST /v1/bookings/{id}/reviews only when eligibility is satisfied

## Partner
- POST /v1/partner-applications
- GET /v1/partners/{id}/bookings
- POST /v1/partners/{id}/services
- PATCH /v1/services/{id}/availability
All writes require membership/permission checks.

## Admin
Partner verification, service moderation, booking support, rewards administration, emergency-contact verification and audit access require explicit admin authorization. Sensitive mutations must write audit events.

## Booking invariant
Create-booking must run transactionally: validate authenticated user → validate idempotency key → validate availability token and quote expiry → lock relevant inventory → reject insufficient inventory → revalidate authoritative price/rules → create booking/items/price snapshot/payment state → decrement/hold inventory → commit → emit notification event. A retry with the same idempotency key must not create a second booking.

## Money
Store monetary values as integer minor-unit-safe amounts with ISO currency codes. The server owns all totals. Historical bookings retain immutable price/rule snapshots.

## Security
HTTPS only; server-side authorization and validation; rate limiting; private verification-document storage; secrets outside the repository; audit sensitive actions. Authentication/provider implementation remains deliberately vendor-neutral at this stage.
