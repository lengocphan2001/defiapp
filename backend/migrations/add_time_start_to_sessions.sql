-- Add time_start column to sessions table
-- This migration adds the time_start column to existing sessions tables

-- Check if time_start column exists, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'sessions' 
     AND COLUMN_NAME = 'time_start') = 0,
    'ALTER TABLE sessions ADD COLUMN time_start TIME DEFAULT "09:00:00" AFTER session_date',
    'SELECT "time_start column already exists" as message'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing sessions to have default time_start value
UPDATE sessions 
SET time_start = '09:00:00' 
WHERE time_start IS NULL;

-- Verify the update
SELECT 
    id,
    session_date,
    time_start,
    status,
    registration_fee
FROM sessions 
ORDER BY session_date DESC 
LIMIT 5; 