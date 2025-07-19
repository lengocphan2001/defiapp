-- Add status column to nft_transactions table
-- This allows tracking pending payments vs completed payments

ALTER TABLE nft_transactions 
ADD COLUMN status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed' AFTER transaction_type;

-- Update existing records to have 'completed' status
UPDATE nft_transactions SET status = 'completed' WHERE status IS NULL; 