-- Migration: 0006_add_room_fee_deposit.sql
-- Description: Add room_fee_thb and deposit_thb columns to bookings table

ALTER TABLE bookings ADD COLUMN room_fee_thb INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN deposit_thb INTEGER NOT NULL DEFAULT 0;
