-- Migration: Add prescription downloads tracking table
-- File: 007_create_prescription_downloads.sql
-- Fixed: Matched exact data types from existing tables

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS prescription_downloads;

-- Create table with exact matching data types
CREATE TABLE prescription_downloads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id BIGINT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  download_type ENUM('pdf', 'image', 'email') NOT NULL,
  file_path VARCHAR(500),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_prescription (prescription_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_download_type (download_type),
  INDEX idx_prescription_user (prescription_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add foreign keys after table creation
ALTER TABLE prescription_downloads
  ADD CONSTRAINT fk_prescription_downloads_prescription
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE;

ALTER TABLE prescription_downloads
  ADD CONSTRAINT fk_prescription_downloads_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
