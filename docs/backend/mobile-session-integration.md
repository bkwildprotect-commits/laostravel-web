# Mobile session and selected-departure quote integration

`GET /api/v1/auth/session` uses the existing runtime OIDC verifier and mapped
ACTIVE LaosTravel identity. It reads the internal profile, owned Partner
memberships and latest owned application status; it never grants roles,
provisions users or approves applications. Responses are `no-store` and vary by
Authorization. Missing/invalid/unmapped tokens return 401; unconfigured auth
returns 503. Administrative roles and document contents are not exposed.

The existing availability quote request accepts an optional UUID
`availabilityId`. Mobile supplies the selected intercity departure's ID; the
query binds it to the selected service, date and available quantity. Legacy
clients may retain date-based selection. The quote response includes the
resolved ID. Booking still uses the server-issued quote/token, so clients do not
choose inventory separately at booking or own payment/commission truth.

Mobile release entry excludes prototype catalogs and locally successful
registration/booking flows. Phone provider tokens must resolve to the session
endpoint before an account is presented as verified. Client configuration,
trusted identity provisioning, approved Partner evidence uploads and device
verification remain activation gates. See the Mobile repository's
`docs/mobile-backend-activation.md` for the concrete RC checklist.
