-- Migration: 0004_update_admin_names.sql
-- Description: Update admin display names for Pathaithep and Nathlada

UPDATE admins 
SET display_name = 'ไผทเทพ ตุทานนท์' 
WHERE username = 'pathaithep';

UPDATE admins 
SET display_name = 'นาถลดา ศรียะพันธ์' 
WHERE username = 'nathlada';
