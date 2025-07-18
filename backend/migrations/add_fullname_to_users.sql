-- Add fullname column to users table
ALTER TABLE users ADD COLUMN fullname VARCHAR(100) NULL AFTER phone;

-- Update existing users to have a default fullname based on username
UPDATE users SET fullname = username WHERE fullname IS NULL; 