-- Migration: 0001_initial_schema.sql
-- Description: Create initial schema for Meeting Room Booking System

-- 1. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity_max INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Seed initial rooms
INSERT OR IGNORE INTO rooms (id, name, capacity_max, created_at) VALUES
  ('floor2', 'หอประชุมชั้น 2', 100, 1730000000),
  ('floor7', 'ห้องประชุมชั้น 7', 300, 1730000000);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Seed 3 Admin accounts (Initial temp password: Admin@1234)
INSERT OR IGNORE INTO admins (id, username, password_hash, display_name, created_at) VALUES
  ('admin_chookait', 'chookait', '$2a$12$6LAdqb7C8KhQ0DtsWOVEJuqChOLOlF/qNC2phlv00.GkxdnFJWPVu', 'ชูเกียรติ กุศลสถิตย์', 1730000000),
  ('admin_pathaithep', 'pathaithep', '$2a$12$6LAdqb7C8KhQ0DtsWOVEJuqChOLOlF/qNC2phlv00.GkxdnFJWPVu', 'ไผทเทพ ตุทานนท์', 1730000000),
  ('admin_nathlada', 'nathlada', '$2a$12$6LAdqb7C8KhQ0DtsWOVEJuqChOLOlF/qNC2phlv00.GkxdnFJWPVu', 'นาถลดา ศรียะพันธ์', 1730000000);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  booking_code TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  
  -- Step 1 Activity info
  activity_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  coordinator_name TEXT NOT NULL,
  coordinator_phone TEXT NOT NULL,
  coordinator_line_id TEXT,
  meeting_type TEXT NOT NULL CHECK(meeting_type IN ('seminar', 'small_group', 'wedding')),
  attendees_count INTEGER NOT NULL CHECK(attendees_count > 0),
  staff_count INTEGER NOT NULL DEFAULT 0 CHECK(staff_count >= 0),
  
  -- Step 2 Venue layout
  table_layout TEXT NOT NULL CHECK(table_layout IN ('theater', 'classroom', 'cluster', 'ushape', 'boardroom')),
  vvip_seats INTEGER NOT NULL DEFAULT 0,
  vip_seats INTEGER NOT NULL DEFAULT 0,
  
  -- Times stored in epoch UTC seconds
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
  total_price_thb INTEGER NOT NULL DEFAULT 0,
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);

-- 4. Booking Items Table (Foods, Beverages snapshot)
CREATE TABLE IF NOT EXISTS booking_items (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(booking_id);

-- 5. Booking Status History
CREATE TABLE IF NOT EXISTS booking_status_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT,
  changed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_booking ON booking_status_history(booking_id);

-- 6. Notifications Table (Admin Web Notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  event_type TEXT NOT NULL,
  history_id TEXT NOT NULL REFERENCES booking_status_history(id),
  recipient_type TEXT NOT NULL DEFAULT 'admin',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(booking_id, event_type, recipient_type, history_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_type, is_read);

-- 7. LINE Notifications Queue (Decoupled Push Notifications)
CREATE TABLE IF NOT EXISTS line_notifications (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  history_id TEXT NOT NULL REFERENCES booking_status_history(id),
  retry_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  sent_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(booking_id, history_id)
);

CREATE INDEX IF NOT EXISTS idx_line_notif_status ON line_notifications(status);
