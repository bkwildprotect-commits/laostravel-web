# Commercial service-area contract

LaosTravel geographic discovery and Partner registration are nationwide-ready, but commercial booking is separately gated by the backend.

- A service must have an explicit `service_area_assignments` row.
- Its `service_areas.commercial_status` must be `BOOKING_ENABLED`.
- Missing assignments fail closed; the client cannot override the decision.
- Vang Vieng (`LA-VTE-VV`) is seeded as the launch BOOKING_ENABLED area.
- Other Laos areas may be added as `REGISTRATION_ONLY` so Partners/locations can exist without commercial booking.
- Opening another area is an auditable operational/configuration decision; it does not require changing booking lifecycle or client code.

This gate is checked inside the booking transaction before inventory is reserved.