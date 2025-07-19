-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_date DATE NOT NULL UNIQUE,
  time_start TIME DEFAULT '09:00:00',
  status ENUM('active', 'closed') DEFAULT 'active',
  registration_fee DECIMAL(20,8) DEFAULT 20000.00000000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create session_registrations table
CREATE TABLE IF NOT EXISTS session_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  registration_fee DECIMAL(20,8) NOT NULL,
  status ENUM('registered', 'cancelled') DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session_user (session_id, user_id)
);

-- Create nft_transactions table for tracking NFT transactions
CREATE TABLE IF NOT EXISTS nft_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nft_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  transaction_type ENUM('buy', 'sell') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
); 