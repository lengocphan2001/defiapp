-- Create NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id VARCHAR(18) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL,
  price DECIMAL(20, 2) NOT NULL DEFAULT 0.00000000,
  type ENUM('sell', 'buy') DEFAULT 'sell',
  status ENUM('available', 'sold', 'cancelled') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_price (price),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 