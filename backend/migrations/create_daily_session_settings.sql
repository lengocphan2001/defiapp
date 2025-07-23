-- Create daily_session_settings table
CREATE TABLE IF NOT EXISTS daily_session_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  time_start TIME NOT NULL DEFAULT '09:00:00',
  registration_fee DECIMAL(20,8) NOT NULL DEFAULT 20000.00000000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO daily_session_settings (time_start, registration_fee, is_active) 
VALUES ('09:00:00', 20000, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP; 