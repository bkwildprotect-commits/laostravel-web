-- 0027: harden shared Smart Pickup decisions and prevent synthetic route data.
BEGIN;

ALTER TABLE intercity_pickup_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE intercity_pickup_requests
  DROP CONSTRAINT IF EXISTS smart_pickup_decision_integrity;
ALTER TABLE intercity_pickup_requests
  ADD CONSTRAINT smart_pickup_decision_integrity CHECK(
    (operator_status='PENDING' AND decided_at IS NULL
      AND route_detour_m IS NULL AND route_detour_seconds IS NULL)
    OR
    (operator_status='ACCEPTED' AND decided_at IS NOT NULL)
    OR
    (operator_status='DECLINED' AND decided_at IS NOT NULL
      AND route_detour_m IS NULL AND route_detour_seconds IS NULL)
    OR
    (operator_status='CANCELLED'
      AND route_detour_m IS NULL AND route_detour_seconds IS NULL)
  );

ALTER TABLE intercity_pickup_requests
  DROP CONSTRAINT IF EXISTS smart_pickup_label_length;
ALTER TABLE intercity_pickup_requests
  ADD CONSTRAINT smart_pickup_label_length
  CHECK(pickup_label IS NULL OR char_length(btrim(pickup_label)) BETWEEN 1 AND 160);

CREATE INDEX IF NOT EXISTS idx_intercity_pickup_requests_operator_queue
  ON intercity_pickup_requests(operator_status,requested_at)
  WHERE operator_status='PENDING';

INSERT INTO schema_migrations(version)
VALUES ('0027_smart_pickup_decision_integrity') ON CONFLICT(version) DO NOTHING;
COMMIT;
