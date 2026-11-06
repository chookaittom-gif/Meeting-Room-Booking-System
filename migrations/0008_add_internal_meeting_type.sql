-- Migration: 0008_add_internal_meeting_type.sql
-- Description: Update bookings table CHECK constraint to support 'internal' meeting_type

CREATE TABLE IF NOT EXISTS bookings_new (
  id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  booking_code TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  activity_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  coordinator_name TEXT NOT NULL,
  coordinator_phone TEXT NOT NULL,
  coordinator_line_id TEXT,
  meeting_type TEXT NOT NULL CHECK(meeting_type IN ('seminar', 'small_group', 'wedding', 'internal')),
  attendees_count INTEGER NOT NULL CHECK(attendees_count > 0),
  staff_count INTEGER NOT NULL DEFAULT 0 CHECK(staff_count >= 0),
  table_layout TEXT NOT NULL CHECK(table_layout IN ('theater', 'classroom', 'cluster', 'ushape', 'boardroom')),
  vvip_seats INTEGER NOT NULL DEFAULT 0,
  vip_seats INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
  total_price_thb INTEGER NOT NULL DEFAULT 0,
  room_fee_thb INTEGER NOT NULL DEFAULT 0,
  deposit_thb INTEGER NOT NULL DEFAULT 0,
  equipment_needed TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO bookings_new (
  id, request_key, booking_code, room_id,
  activity_name, project_name, coordinator_name, coordinator_phone, coordinator_line_id,
  meeting_type, attendees_count, staff_count,
  table_layout, vvip_seats, vip_seats,
  starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb, equipment_needed,
  created_at, updated_at
)
SELECT
  id, request_key, booking_code, room_id,
  activity_name, project_name, coordinator_name, coordinator_phone, coordinator_line_id,
  meeting_type, attendees_count, staff_count,
  table_layout, vvip_seats, vip_seats,
  starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb, equipment_needed,
  created_at, updated_at
FROM bookings;

DROP TABLE bookings;

ALTER TABLE bookings_new RENAME TO bookings;

CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
