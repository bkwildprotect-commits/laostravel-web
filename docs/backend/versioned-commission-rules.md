# Versioned commission rules — Shared Product Contract 2026-10-10.v2

Commission is disabled by default unless the Partner is outside the individual six-calendar-month `LAUNCH_FREE` period, has separately accepted a `COMMISSION` commercial term, and an active effective versioned rule exists.

## Current v2 requirements

- The six-calendar-month `LAUNCH_FREE` period starts only at audited commercial activation of an APPROVED Partner with an ACTIVE service, effective price offer, future capacity and a `BOOKING_ENABLED` area.
- Booking count does not consume or shorten the period.
- Expiry never silently starts commission. Missing accepted terms or an active rule fails closed.
- Booking allocation snapshots the accepted commercial-terms version and active commission-rule version.
- Commission earns only on `COMPLETED + PAID` with accepted terms evidence. Payment alone, check-in or client claims cannot earn commission.
- Historical rates and terms snapshots are immutable. Refund/dispute and settlement reconciliation follow the Shared Product Contract; no automatic money transfer or offset is implied.

## Legacy records

The five-booking `TRIAL_FREE` ordinal model, including historical `partner_trial_ledger` rows and the old “booking six” rule, is superseded. It may remain for audit/compatibility but is not the source of new commercial eligibility.

Exact commission rates, settlement frequency and Lao tax/invoice treatment remain owner decisions until formally approved. No percentage is invented or auto-activated.
