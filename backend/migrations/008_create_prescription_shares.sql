-- Migration: Add prescription sharing system
-- File: 008_create_prescription_shares.sql

CREATE TABLE IF NOT EXISTS prescription_shares (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id BIGINT UNSIGNED NOT NULL,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  created_by INT NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_type ENUM('pharmacy', 'doctor', 'family', 'other') DEFAULT 'other',
  expires_at TIMESTAMP NOT NULL,
  access_count INT DEFAULT 0,
  last_accessed_at TIMESTAMP NULL,
  last_accessed_ip VARCHAR(45),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_share_token (share_token),
  INDEX idx_prescription (prescription_id),
  INDEX idx_expires (expires_at),
  INDEX idx_active (is_active),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
