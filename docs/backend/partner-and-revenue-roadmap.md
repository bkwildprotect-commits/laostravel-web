# LaosTravel partner trust and fair revenue

Decision record, 28 September 2026. This is the implementation boundary for both web and mobile clients using the shared backend. A schema or plan is not a launched feature.

## Partner registration and approval

Free signup starts with partner kind `INDIVIDUAL_GUIDE` or `BUSINESS`, category, contact and payout details. An individual supplies identity evidence and the guide credential required for their specific work; a business supplies authorized representative, enterprise/tax details, and the licenses required for each offered service. Requirements by category and jurisdiction must be confirmed with the responsible Lao authorities before production approval. Never interpret a company registration as proof of every sector license. Avoid collecting documents irrelevant to a category.

Flow: DRAFT → DOCUMENTS_SUBMITTED → IDENTITY_REVIEW → DOCUMENT_REVIEW → AUTHORITY_REVIEW (only where needed) → APPROVED or REJECTED. Review evidence includes type, number, issuer, issue/expiry dates, method, reviewer, time, and an access controlled evidence key. Government API is an optional method contingent on official authorization; manual government check and LaosTravel review remain available. Approval is revocable when documents expire. No public claim of government verification unless the relevant authority actually verified it.

Booking gate: an ACTIVE service needs an APPROVED partner with ACTIVE business status. The server checks these in the booking transaction; clients must not treat a local badge as authorization. Payment collection and listing activation need their own equivalent checks before opening them. Existing partners need a deliberate evidence review and status transition before this gate is deployed, because unapproved partners become unbookable.

## Revenue and fairness

Current core: versioned booking commission, with the existing five completed bookings free trial; show the customer total, commission rule, taxes/fees where applicable, and partner net before acceptance. Cancellation returns an unused trial place under the existing ledger rules. Optional future modules: separately labelled Ads Center / Sponsored Zone, attributable affiliate or referral rewards on qualifying completed bookings, optional business analytics, opt-in campaigns, and later B2B reporting. Each requires its own ledger, terms and feature flag; do not count the same booking revenue twice. Ads spending never affects organic rank. No paid placement in organic results, no entry popup, and no required subscription to participate.

Cross-service rewards unlock only after the prior eligible service completes. A customer can skip, dismiss or end the chain without penalty. Fund discounts from an explicit partner/platform budget and cap liability before activation. Verified reviews attach to completed bookings; paid promotion cannot influence review scores.

## Shipping sequence

1. Current change: verification evidence schema, dedicated ad inventory schema, booking gate, isolated organic rank contract.
2. Before activating partner onboarding: secure evidence storage, access control, per-category requirements confirmed with authorities, reviewer audit, expiration/revocation workflow, application screens and tests.
3. Before activating ads or referrals: separate labelled UI, spend and attribution ledgers, budget limits, disclosure, abuse controls and settlement tests.
4. After MVP: optional analytics, campaigns and B2B. Keep these behind disabled feature flags until independently tested.

Government coordination: ask relevant registry and tourism/transport authorities which credentials apply to each category, permitted copy retention and retention period, available verification channels, lawful sharing/consent, and how revocation is reported. No assumption of a public API.
