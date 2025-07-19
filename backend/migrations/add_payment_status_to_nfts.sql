-- Add payment_status column to nfts table
ALTER TABLE nfts ADD COLUMN payment_status ENUM('pending', 'completed', 'unpaid') DEFAULT 'unpaid';

-- Update existing NFTs to have completed payment_status if they have completed transactions
UPDATE nfts n 
SET payment_status = 'completed' 
WHERE EXISTS (
    SELECT 1 FROM nft_transactions nt 
    WHERE nt.nft_id = n.id 
    AND nt.status = 'completed'
);

-- Update NFTs with pending transactions to have pending payment_status
UPDATE nfts n 
SET payment_status = 'pending' 
WHERE EXISTS (
    SELECT 1 FROM nft_transactions nt 
    WHERE nt.nft_id = n.id 
    AND nt.status = 'pending'
); 