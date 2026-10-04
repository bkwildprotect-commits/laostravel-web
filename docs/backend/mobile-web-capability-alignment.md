# Mobile ↔ Website capability alignment

Audited Mobile main at `3144a3f2acce` against Website shared backend.

## Shared source of truth
Website backend owns booking lifecycle, payment status, Partner verification, commercial terms, final price/discount snapshots, service-area eligibility, inventory and audit. Mobile/Web are clients.

## Current Mobile capabilities to support
- **Intercity transport:** nationwide route discovery/request UX, Partner departures, booking-owned seat inventory, LAK per-person pricing, PAY_AT_PARTNER/UNPAID, booking-specific Partner contact.
- **Self-drive rental:** car/motorbike/bicycle plus 2-seat/4-seat Buggy; Partner-set LAK price, hourly/daily pricing, booking-linked support.
- **Guides & Trips:** licensed guide/tour operator/travel creator drafts; staged DRAFT → SUBMITTED → APPROVED → PUBLISHED; publication requires legal/commercial eligibility, booking-enabled service area and verified meeting GPS.
- **SOS:** dedicated emergency action, separate from normal Partner contact. Emergency numbers must be operationally verified before production. GPS sharing remains consent-based.
- **Map/pickup ETA:** route-derived ETA is presentation data; verified booking GPS remains authoritative.

## Mobile local-MVP logic that MUST NOT become server truth
- hard-coded commission rates in `commission_rule.dart`;
- client-selected six-month promotion start/post-promo rate;
- local decrement of intercity seats;
- hard-coded rental prices;
- client-created final commission/net calculations;
- demo emergency numbers without operational verification.

The authoritative launch policy remains per-Partner six calendar months beginning at approved commercial activation, commission 0% during LAUNCH_FREE, no automatic commission after expiry, and PAY_AT_PARTNER.

## Shared capability mapping
All new verticals use the existing `services`, `availability`, authoritative `service_price_offers`, booking transaction and service-area gate rather than inventing parallel booking engines. `service_kind` and `service_capability_details` carry vertical metadata.