-- Migration: 0007_add_staff_role.sql
-- Description: Update admins table CHECK constraint to support 'staff' role

CREATE TABLE IF NOT EXISTS admins_new (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('superadmin', 'admin', 'staff')),
  created_at INTEGER NOT NULL
);

INSERT INTO admins_new (id, username, password_hash, display_name, role, created_at)
SELECT id, username, password_hash, display_name, COALESCE(role, 'admin'), created_at FROM admins;

DROP TABLE admins;

ALTER TABLE admins_new RENAME TO admins;
