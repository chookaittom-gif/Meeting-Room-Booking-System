-- Rollback: 0001_rollback_initial_schema.sql
-- Description: Rollback script for 0001_initial_schema.sql

DROP TABLE IF EXISTS line_notifications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS booking_status_history;
DROP TABLE IF EXISTS booking_items;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS rooms;
