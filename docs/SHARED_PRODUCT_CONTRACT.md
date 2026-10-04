# LaosTravel Shared Product Contract

This contract is normative for **both** `laostravel-web` and `laos-travel-app`.
Neither client may invent incompatible booking, payment, partner, transport, SOS,
ranking, or service-area semantics.

## Core lifecycle

- Booking/service: `REQUESTED -> CONFIRMED -> CHECKED_IN -> IN_SERVICE -> COMPLETED`
- Terminal alternatives: `CANCELLED`, `NO_SHOW`
- Payment is independent: `UNPAID | PAID | REFUNDED | DISPUTED`
- Check-in never implies payment.
- Commission rate is snapshotted on the actual booking transaction.
- Reviews marked verified must reference a completed booking.
- Partner verification is required before commercial selling.
- Material booking/payment/commission/verification/settlement changes are auditable.

## Service areas

The data model is nationwide. Commercial availability is controlled per service
area/category. A closed area must not accept commercial bookings merely because
a partner can register there.

## Intercity transport

Vehicle types are distinct:

- `VIP_VAN`: may support Smart Pickup.
- `BUS`: station/designated-stop boarding only; Smart Pickup is not available.

A partner publishes origin, destination, departure, vehicle/capacity, fare and
service status. Remaining seats are derived from inventory/bookings and must not
be arbitrarily increased after bookings.

A traveller can publish trip demand (origin, destination, date/time window,
passenger count) and match to suitable departures.

### VIP Van Smart Pickup

A traveller may request pickup at a hotel, restaurant or confirmed coordinate.
A nominal ~2 km proximity is a matching guideline, **not a guarantee**. Production
matching must use real road-route/detour data when available, not straight-line
distance or a guessed speed. The van operator/driver must explicitly accept the
detour before LaosTravel represents pickup as confirmed. Passenger count may
affect prioritisation, but never overrides operator consent, seat inventory,
route safety or existing passengers.

The confirmed pickup coordinate is private booking data and is shared only with
the relevant traveller/partner after user confirmation.

## ETA

Never fabricate pickup ETA from a hard-coded average speed. Display an ETA such
as "wait another 30 minutes" only from a live/authoritative route-duration
source tied to the vehicle location. If that source is unavailable, say that
live ETA is unavailable/waiting for vehicle location.

## SOS

SOS is an emergency feature, not partner support. Partner phone/chat belongs to
the relevant partner/booking page. National hotline data currently supplied by
the product owner is:

- Police: 1191
- Fire: 1190
- Ambulance / medical emergency: 1195
- Tourist Police: 1192
- Emergency electricity: 1199

Local emergency contacts should be selected from a verified LaosTravel-managed
directory using user-consented location. National contacts remain available
without location permission. Emergency numbers require production verification
before public launch. Opening a number should use an explicit confirmation
before handing off to the phone dialer.

## Fairness and ads

No Pay-to-Rank. Advertising is clearly labelled and separated from organic
ranking. Ads must not block the first view. Prohibited ad categories include
alcohol/brewery, party/intoxication and illegal goods/services.

## Cross-client rule

When this contract changes, corresponding web and mobile implementation work
must be tracked together. A client-specific UI may differ, but shared domain
semantics and persisted data must remain compatible.
