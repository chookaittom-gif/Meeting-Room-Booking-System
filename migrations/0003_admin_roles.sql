-- Migration: 0003_admin_roles.sql
-- Description: Add role column to admins table and promote chookait to superadmin

ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('superadmin', 'admin'));

UPDATE admins SET role = 'superadmin' WHERE username = 'chookait';
