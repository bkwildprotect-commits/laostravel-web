# Cross-client implementation matrix

Reference Mobile baseline: `laos-travel-app@2e35aabe3d553f19f163deed1a91dc581a907c9e` (merged PR #29/#31); commercial alignment: Mobile PR #32. Reference Website contract: `2026-10-05.v1` + `SHARED_PRODUCT_CONTRACT.md`. Local model parity and live API integration are separate release gates.

| Domain | Website/backend | Mobile current state | Required convergence |
|---|---|---|---|
| Booking lifecycle | authoritative V2 | EXPIRED and checked-in cancellation aligned; all 64 transition pairs covered | consume server lifecycle; retain transition regressions |
| Payment | UNPAID/PAID/REFUNDED/DISPUTED, PAY_AT_PARTNER | mostly aligned | remove client payment truth callbacks |
| 6-month free period | per-Partner activation; accepted terms required after expiry | PR #32 aligns local calendar expiry and acceptance guard | read backend activation/expiry/accepted terms; local models are not authority |
| Commission | versioned/dormant until terms | hard-coded category rates | remove active hard-coded production rates |
| Partner discount | authoritative quote/snapshot | local promotion math | submit Partner offer; display server quote |
| Service area | server fail-closed | local gate/model | backend response is final authority |
| Intercity seats | shared inventory contract | local mutable seat count MVP | replace with backend atomic inventory |
| Smart Pickup | backend schema/operator consent | UI/ETA prototypes | connect request/decision/route duration |
| Rental/Buggy | shared service kind/pricing | demo hard-coded prices | publish/read backend price offers |
| Guides & Trips | shared eligibility contract | staged local model | persist publication/capacity server-side |
| GPS/navigation | verified registry + booking snapshot | map/GPS models | consume verified/snapshotted coordinates |
| SOS | separated emergency semantics | dedicated floating action | replace demo/unverified numbers with verified directory |
| Partner chat/translation | normative contract | translated chat UI | add authenticated booking-scoped backend channel |
| Reviews | completed-booking invariant | local verified-review models | issue verification only from backend booking |
| Coins/coupons/rewards | transactional invariants | local wallet/reward models | backend ledger/idempotency is final authority |
| Currency | LAK authoritative + indicative display | currency quote model | consume server/sourced quote policy |
| Ads/ranking | No Pay-to-Rank | no external ads MVP | keep paid ads separate from organic rank |
| Languages | 7 locales | 7 locales | keep same locale identifiers/fallback policy |

## Release rule
A Mobile feature that changes persisted business semantics is not production-ready until its shared backend contract exists. A Website feature must not invent semantics that Mobile cannot consume through the same API. UI parity is not required; domain parity is.
