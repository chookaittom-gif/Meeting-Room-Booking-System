-- Migration: 0002_system_settings.sql
-- Description: System settings table for toggling features like LINE notifications

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Default settings: LINE notifications enabled by default
INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES
  ('line_notify_enabled', '1', 1730000000);
