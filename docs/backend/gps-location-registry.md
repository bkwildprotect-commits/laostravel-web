# GPS location registry and navigation policy

LaosTravel stores geographic data nationwide even while commercial booking is enabled only in launch service areas.

## Location roles
- `PARTNER_VENUE`: one canonical business pin per partner.
- `SERVICE_MEETING_POINT`: one pickup/meeting pin per bookable service.
- `ATTRACTION`: a discoverable destination that may exist without a commercial service.

A GPS record never makes an area, partner, or service commercially bookable. Existing service-area, partner-verification, service-status, availability, quote, and booking rules remain authoritative.

## Trust and privacy
Partner-submitted pins start unverified. Only verified pins may be exposed through customer-facing navigation. `PUBLIC` pins can be shown in discovery. `BOOKING_ONLY` pins require booking context. `PRIVATE` pins are never customer-facing.

Location verification records the reviewer and timestamp. Coordinate changes must return the record to review in the future write API; the API must also write an audit log. The database foundation deliberately does not infer payment state from check-in or navigation.

## Nationwide rollout
Partners and attractions outside Vang Vieng may register geographic data before their province is commercially opened. Commercial booking remains gated separately. This permits LaosTravel to build a nationwide map without accidentally enabling sales in closed areas.

## Navigation
The web client may open an external navigation provider using the verified destination coordinates. Navigation URLs are derived from coordinates, not stored as authoritative data. A future provider adapter may support Google Maps, Apple Maps, or another map application without changing the location schema.
