-- Migration: 0009_add_line_payload_capture.sql
-- Description: Store the exact JSON body sent to the LINE push API in the
--   notification queue row (self-evidencing notifications), so ?????-style
--   rendering bugs can be diagnosed from stored data without redeploying
--   instrumentation. Capped at write time (see lib/line-service.ts) and
--   trimmed after a retention window to avoid keeping PII copies forever.

ALTER TABLE line_notifications ADD COLUMN payload_json TEXT;
