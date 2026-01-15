-- Refined migration to support enriched hospital data
ALTER TABLE hospitals
ADD COLUMN description TEXT AFTER address,
ADD COLUMN website VARCHAR(255) AFTER email,
ADD COLUMN data_source VARCHAR(50) DEFAULT 'manual' AFTER rating,
MODIFY COLUMN type ENUM('government', 'private', 'public', 'charitable') DEFAULT 'private';

-- Ensure specialties and facilities are JSON (if supported/needed)
-- MODIFY COLUMN specialties JSON; -- Skipping JSON conversion for now to avoid data type issues
-- MODIFY COLUMN facilities JSON;

-- Index for faster filtering
CREATE INDEX idx_data_source ON hospitals(data_source);
