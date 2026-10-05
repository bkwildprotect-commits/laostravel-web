# LaosTravel canonical cross-platform contract — v1

Version: **2026-10-05.v1**

This is the compatibility boundary for Website, Android and iOS. UI may differ by device; business truth must not.

| Domain | Canonical rule | Authority |
|---|---|---|
| Booking | REQUESTED → CONFIRMED → CHECKED_IN → IN_SERVICE/COMPLETED; CANCELLED/EXPIRED/NO_SHOW supported | Server |
| Payment | UNPAID / PAID / REFUNDED / DISPUTED; separate from service lifecycle | Server |
| Launch payment | PAY_AT_PARTNER; check-in never means paid | Server |
| Partner verification | PENDING / APPROVED / REJECTED / SUSPENDED | Server |
| Launch commercial terms | 6 calendar months per Partner from approved commercial activation; 0% commission | Server |
| Post-free period | no automatic commission; separately accepted terms required | Server |
| Price | LAK authoritative; Partner list price/discount become server quote + immutable snapshot | Server |
| Display FX | indicative only; never changes settlement truth | Client presentation from sourced server-compatible rate data |
| Service area | nationwide data/registration; commercial booking only BOOKING_ENABLED; Vang Vieng initial launch area | Server |
| Inventory | availability/seats reserved transactionally; no client decrement as truth | Server |
| Reviews | verified status derives from eligible completed booking; client boolean is not trusted | Server |
| Rewards/coupons/coins | booking-linked, idempotent, no double benefit | Server |
| GPS | verified location + immutable booking snapshot; traveller consent for live sharing | Server + explicit traveller consent |
| SOS | emergency action separate from ordinary Partner contact; operational contacts must be verified | Operational/server config |
| Ranking | No Pay-to-Rank; ads separated/labeled | Server/product policy |

## Service taxonomy
Canonical service kinds:
`STAY`, `RESTAURANT`, `ATTRACTION`, `ACTIVITY`, `INTERCITY_TRANSPORT`, `SELF_DRIVE_RENTAL`, `GUIDED_TRIP`, `PRIVATE_TRANSFER`.

Map and SOS are product utilities, **not bookable service categories**.

## Mobile reconciliation required
Current Mobile remains a useful UX prototype, but these local rules must be replaced when API integration is performed:
1. Canonical `EXPIRED` is implemented by Mobile PR #29 and mapped by Website PR #50. It remains terminal and is allowed from `REQUESTED` only. Mobile PR #31 also aligns `CHECKED_IN` → `CANCELLED`. Keep the full transition-pair regressions passing.
2. Map Mobile `verified` Partner status to canonical `APPROVED`; do not create a second backend status vocabulary.
3. Replace local `open/comingSoon` service-area authority with backend `BOOKING_ENABLED/REGISTRATION_ONLY/SUSPENDED`.
4. Remove client-authored `commissionRateBps`, hard-coded commission tables and client-selected promotion start/post-promo rate from booking economics.
5. Replace local/hard-coded final rental/transport/guide prices with server quote snapshots.
6. Replace local seat/departure reservation with transactional backend availability.
7. Never trust `verifiedService` on a review from the client; derive it from booking eligibility.
8. Rewards must be granted by backend booking-linked/idempotent rules, not merely because the client says COMPLETED.
9. Currency snapshot/double arithmetic is presentation-only; LAK integer amounts remain authoritative.
10. Emergency phone data must be verified operational configuration before production.

Mobile PR #32 aligns the local six-month models with individual Partner activation, calendar-month expiry, and separately accepted post-free commercial terms. This local-domain alignment does not establish authenticated API integration; backend terms and quotes remain authoritative.

## Website reconciliation
Website already consumes/implements the canonical backend domains. New transport, rental and guide surfaces must continue to reuse shared services, availability, price offers, booking, payment and service-area enforcement rather than create vertical-specific truth.

Clients can read the machine-readable contract at `GET /api/v1/meta/shared-contract`.