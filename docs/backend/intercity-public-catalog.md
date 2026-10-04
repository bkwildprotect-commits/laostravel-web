# Public intercity catalog contract

`GET /api/v1/intercity/departures` is the server-owned discovery source for Website and Mobile.

Required query:

- `date=YYYY-MM-DD`

Optional query:

- `originAreaCode`
- `destinationAreaCode`
- `vehicleType=VIP_VAN|BUS`
- `locale=en|lo|th`
- `limit=1..100`

The endpoint only returns future availability with positive, explicit remaining seats when all trust gates pass:

- Partner verification is `APPROVED`.
- Commercial terms are active.
- Service kind is `INTERCITY_TRANSPORT` and publication status is `PUBLISHED`.
- The assigned commercial service area is `BOOKING_ENABLED`.
- An active LAK price offer exists.

Price and seats are server-owned. Clients must still request an authoritative quote before booking and must never calculate availability from cached catalog values.

Pickup is a discriminated contract:

- `VIP_VAN` may return `SMART_PICKUP_REQUEST` only when the service enables it, has a maximum detour, and requires operator approval.
- `BUS` always returns `DESIGNATED_STOP_ONLY`. A client must not offer arbitrary GPS pickup for a bus.
- Vehicle type is not inferred from province or distance. Operators publish the actual service type.

An empty `departures` list is a valid response. If PostgreSQL is not configured, the endpoint fails closed with `503 SERVICE_NOT_CONFIGURED`; it must not return demo departures.


## Designated Bus stops

Bus departures are public only when at least one active, verified designated stop exists. Each stop has a stable ID, area code, Lao and English labels, route order, boarding/drop-off role, and exact coordinates. Partner-submitted stops begin as `PENDING`; only a separate reviewer can mark them `VERIFIED`.

Clients must present `designatedStops` for Bus selection and must submit the selected stop ID in the later booking-location contract. They must never replace a Bus stop with an arbitrary device GPS pin. VIP Van departures may also publish fixed stops, but Smart Pickup remains a separate operator-approved request.
