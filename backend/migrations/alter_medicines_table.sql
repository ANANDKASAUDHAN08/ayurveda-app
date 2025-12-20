-- Add columns to existing medicines table for Indian Medicine Dataset
-- Note: If columns already exist, you'll see warnings - that's OK!

-- Add type column (Tablet, Syrup, Injection, etc.)
ALTER TABLE medicines 
ADD COLUMN type VARCHAR(100) AFTER mrp;

-- Add composition column (Active ingredients)
ALTER TABLE medicines 
ADD COLUMN composition TEXT AFTER type;

-- Add pack_size column (10 tablets, 100ml, etc.)
ALTER TABLE medicines 
ADD COLUMN pack_size VARCHAR(100) AFTER composition;

-- Add data_source to track where data comes from
ALTER TABLE medicines 
ADD COLUMN data_source VARCHAR(50) DEFAULT 'Manual' AFTER pack_size;

-- Update name column size for longer medicine names
ALTER TABLE medicines 
MODIFY COLUMN name VARCHAR(500) NOT NULL;

-- Add indexes for better search performance
CREATE INDEX idx_type ON medicines(type);
CREATE INDEX idx_data_source ON medicines(data_source);
CREATE FULLTEXT INDEX idx_fulltext_search ON medicines(name, composition);

-- Show updated structure
DESCRIBE medicines;

-- Count existing medicines
SELECT COUNT(*) as existing_medicines FROM medicines;
