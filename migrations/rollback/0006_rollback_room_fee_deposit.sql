-- Rollback: 0006_rollback_room_fee_deposit.sql
ALTER TABLE bookings DROP COLUMN room_fee_thb;
ALTER TABLE bookings DROP COLUMN deposit_thb;
