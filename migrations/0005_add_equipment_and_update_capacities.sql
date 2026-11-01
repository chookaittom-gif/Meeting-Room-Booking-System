-- Migration: 0005_add_equipment_and_update_capacities.sql
-- Description: Add equipment_needed to bookings and update room capacities (floor2: 250, floor7: 450)

ALTER TABLE bookings ADD COLUMN equipment_needed TEXT;

UPDATE rooms SET capacity_max = 250 WHERE id = 'floor2';
UPDATE rooms SET capacity_max = 450 WHERE id = 'floor7';
