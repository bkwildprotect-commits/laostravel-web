# LaosTravel shared launch commercial contract

This contract is authoritative for Website, Android and iOS clients.

## Partner launch-free period
- Every eligible Partner receives six **calendar months** free individually.
- The clock starts only when the Partner is APPROVED, business status is ACTIVE, and LaosTravel activates commercial booking access. Signup or lead-registration time does not consume the free period.
- During the active window LaosTravel commission is 0%. Booking count does not shorten the window.
- Expiry does **not** silently start commission. The Partner must enter separately approved commercial terms before a commissionable booking can be created.
- Historical bookings retain the commercial terms and authoritative price snapshot that applied when booked.

## Price and Partner discount
- Partner controls the offered list price and may choose its own discount.
- The server creates the authoritative quote and snapshots the actual customer total accepted at booking.
- The Traveller pays the amount represented by that authoritative booking/price snapshot; clients must not recalculate a different amount locally.

## Launch payment
- Launch default is PAY_AT_PARTNER.
- LaosTravel records booking/payment state but does not mark a booking PAID merely because it was booked, checked in, a QR was displayed, or a receipt was uploaded.
- Payment is made directly to the Partner using a Partner-declared supported method. LaosTravel is not the holder of customer funds in this launch mode.

## Shared-client rule
Website, Android and iOS are clients of the same backend. Clients must not own commission rates, free-period eligibility, final prices, payment truth or booking lifecycle truth.

The legacy five-booking free-trial allocation and any client-hard-coded commission percentages are superseded by this contract and must not be used for new bookings.
