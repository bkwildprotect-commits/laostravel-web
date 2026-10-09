# LaosTravel Shared Product Contract

**Normative for both `laostravel-web` and `laos-travel-app`.** UI may differ by platform; persisted domain semantics may not. Backend is the source of truth for legal/commercial eligibility, inventory, price, booking, payment, rewards, commercial terms and audit.

## 1. Identity, roles and Partner verification
- Traveller and Partner profiles are distinct even when one account can switch UI mode.
- A Partner may prepare/register nationwide, but may sell only after LaosTravel verification is `APPROVED`, business status is `ACTIVE`, and the relevant commercial service area is enabled.
- Required verification evidence includes business identity/licence, responsible owner/manager identity and settlement account details according to the approved operational policy.
- Admin/reviewer authority is server-side. Never trust a client/JWT role claim as business authorization.
- Verification changes are auditable.

## 2. Booking and payment lifecycle
- Booking/service: `REQUESTED → CONFIRMED → CHECKED_IN → IN_SERVICE → COMPLETED`.
- Terminal alternatives: `CANCELLED | NO_SHOW`; internal `EXPIRED` is supported for request expiry.
- Payment is independent: `UNPAID | PAID | REFUNDED | DISPUTED`.
- Check-in never means paid. A UI action, QR display, receipt upload or client callback never creates `PAID` truth by itself.
- Releasing or expiring an active request hold restores its reserved quantity exactly once in the same transaction; confirmation retains the reserved inventory.
- Launch payment mode is `PAY_AT_PARTNER`: customer pays the Partner directly using a Partner-declared method. LaosTravel does not hold customer funds in this mode.

## 3. Launch commercial terms
- Each Partner receives **six calendar months `LAUNCH_FREE` individually**, starting only when an APPROVED + ACTIVE Partner is commercially activated to accept real bookings.
- Raw signup/lead date does not consume the period. Booking count does not shorten it.
- Commission is 0% during the active free period.
- Expiry never silently starts commission. A separately approved `COMMISSION` commercial term and active versioned rule are required; otherwise commercial booking fails closed.
- Clients must not contain active/hard-coded commission rates or choose the free-period start date.
- Historical `TRIAL_FREE` / five-free-booking records are legacy only.

## 4. Authoritative pricing and currency
- LAK is authoritative for quotes, booking snapshots and settlement.
- Partner controls list price and may fund a voluntary Partner discount.
- Coupon and LAOS Coins/reward benefits are distinct from Partner discount.
- Server creates the authoritative quote and immutable booking price snapshot. Clients never calculate final payable price, commission or Partner net as source of truth.
- Indicative display currencies may be shown using sourced/recent rates; failure falls back to LAK.

## 5. Service areas and nationwide discovery
- Geographic data, Partner registration and draft preparation are nationwide-ready.
- Commercial booking is separately gated by normalized service area. Vang Vieng is the initial booking-enabled launch area.
- Missing/closed assignment fails closed on the server even if a client displays a booking control.
- Opening/suspending areas is an audited Admin operation.

## 6. Service catalogue
Shared service kinds include `STAY | RESTAURANT | ATTRACTION | ACTIVITY | INTERCITY_TRANSPORT | SELF_DRIVE_RENTAL | GUIDED_TRIP | PRIVATE_TRANSFER`.
All verticals reuse shared Partner eligibility, price offers, availability/inventory, booking transaction, payment and service-area rules rather than creating parallel client booking engines.

## 7. Intercity transport
- `VIP_VAN` and `BUS` are distinct. Bus uses station/designated-stop boarding. VIP Van may support Smart Pickup.
- Partner publishes route/departure/capacity and Partner fare; remaining seats are derived from authoritative inventory/bookings.
- Client-local seat decrement is prototype UX only and must be replaced by atomic backend inventory before production.
- Traveller demand may contain origin, destination, date/time window and passenger count.
- Partner contact belongs to the selected booking/service, never SOS.

### VIP Van Smart Pickup
Pickup may be requested at a hotel, restaurant or user-confirmed coordinate. Approximate proximity is a matching hint, not a guarantee. Production matching uses authoritative road-route/detour data when available. Operator/driver acceptance is required before pickup is confirmed. Confirmed coordinates are private booking data shared only with the relevant Traveller/Partner after consent.

### ETA
Do not fabricate ETA from guessed speed. Show ETA only from authoritative route duration tied to current vehicle location; otherwise show that live ETA is unavailable/waiting for location.

## 8. Self-drive rental
- Supports car, motorbike, bicycle and Buggy where legally/operationally eligible.
- Hourly/daily price is Partner-authored but becomes customer truth only through the server quote/snapshot.
- Availability, active rental/booking and Partner support contact are backend-owned.
- Client hard-coded demo prices are not production truth.

## 9. Guides & Trips
Seller type may be `LICENSED_GUIDE | TOUR_OPERATOR | TRAVEL_CREATOR`.
Publication lifecycle is `DRAFT → SUBMITTED → APPROVED → PUBLISHED`.
A published trip can sell only when seller verification/commercial eligibility, booking-enabled service area and required verified meeting GPS are all satisfied. Departure capacity is backend inventory and must be reserved atomically.

## 10. GPS, navigation and map
- Partner venue/service meeting point/attraction coordinates use the shared location registry and verification lifecycle.
- Booking navigation uses immutable verified booking-location snapshots, not later mutable Partner pins.
- GPS sharing is consent-based and scoped to the relevant booking/interaction.
- Map presentation can differ by client; coordinates/verification truth cannot.

## 11. SOS and Partner support
- SOS is a dedicated emergency action, not a normal service tile and not Partner support.
- Partner phone/chat lives on the relevant booking/service.
- Emergency directory entries must be operationally verified before production. National contacts remain usable without precise-location permission; local selection may use consented location.
- Opening a phone number requires explicit confirmation before dialer handoff.
- No automatic GPS sharing with emergency/Partner recipients without Traveller confirmation.

## 12. Communication and translation
- Traveller and Partner may type in their own language; translated chat may display translated content while preserving access to original content.
- Translation is assistance, not authoritative modification of booking/payment/legal facts.
- Chat identity and booking association must be server-authenticated before production.

## 13. Reviews
- A verified review must reference an eligible completed booking.
- No free-floating client `verified=true` flag.
- Service/Partner reviews are distinct from app-store/product reviews.
- Review/ranking manipulation is prohibited.

## 14. Coupons, LAOS Coins and rewards
- Benefits attach to an eligible booking/transaction and are server-authoritative.
- Prevent duplicate earning/redemption and negative/lost balances with transactional/idempotent rules.
- Concurrent completion reward requests must yield one ledger credit and an idempotent replay for the duplicate.
- Until authoritative benefit redemption is connected, new booking requests with a coupon or positive points redemption fail with HTTP 503 / `BOOKING_BENEFITS_UNAVAILABLE`; benefits must never be silently ignored. Zero points remains a normal booking request. Completed idempotent replays retain their original response.
- Cross-service reward chains are optional; opting out carries no penalty.
- Referral/reward qualification must not be decided solely by client state.

## 15. Fairness, organic ranking and advertising
- No Pay-to-Rank. Paid advertising is clearly labelled and separated from organic ranking.
- Ads do not block first view and do not alter organic rank.
- No hidden fees, fake reviews or dark patterns.
- Prohibited ad categories include alcohol/brewery, party/intoxication, illegal goods/services and other disallowed categories under LaosTravel policy.

## 16. Auditability
Material Booking, Payment, Commission, Partner Verification, Settlement, service-area and location-review changes are auditable. Historical snapshots are not rewritten by later policy changes.

## 17. Cross-client ownership rule
| Concern | Source of truth | Client responsibility |
|---|---|---|
| Identity session | Auth provider + backend mapping | sign-in UX/token transport |
| Partner eligibility | Backend | display state/forms |
| Service area | Backend | discovery/disabled-state UX |
| Price/discount | Backend quote + snapshot | display authoritative values |
| Inventory/seats | Backend transaction | request/display availability |
| Booking lifecycle | Backend | commands + status UI |
| Payment status | Backend | payment instructions/status UI |
| Commercial/free period | Backend | display only |
| Commission | Backend versioned terms | display only |
| Rewards/reviews | Backend transaction | input/display |
| GPS verification | Backend registry | map/pin UX |
| ETA | authoritative route provider/backend | presentation |
| SOS directory | verified operational data | confirmation/dialer UX |

## 18. Change-control rule
Any change to shared enums, lifecycle, pricing, commercial terms, eligibility, inventory, rewards, GPS/privacy, SOS semantics or ranking must update this contract and corresponding backend tests before a client ships it. Mobile/Web-specific experiments may not redefine persisted business truth.
