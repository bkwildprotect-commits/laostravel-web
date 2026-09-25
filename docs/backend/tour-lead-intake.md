# Tour lead intake

POST /api/v1/tour-leads validates name, phone, email, travel date, guest count and explicit contact consent on the server.

The endpoint currently fails closed with HTTP 503 after successful validation because no persistent production storage provider or retention policy has been approved. It must not display a success acknowledgement unless persistence succeeds.

Before production enablement: configure authenticated server-side storage, retention/deletion policy, rate limiting/abuse controls, audit/operations access, privacy notice and 7-language response copy. Never log raw phone/email values in application logs.
