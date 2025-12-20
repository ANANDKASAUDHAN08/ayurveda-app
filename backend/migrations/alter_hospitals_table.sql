-- Add columns to existing hospitals table for data.gov.in import
-- Note: If columns already exist, you'll see errors - that's OK, just means they exist!

-- Check current hospital table structure first
DESCRIBE hospitals;

-- Add latitude column
ALTER TABLE hospitals 
ADD COLUMN latitude DECIMAL(10, 8) AFTER phone;

-- Add longitude column
ALTER TABLE hospitals 
ADD COLUMN longitude DECIMAL(11, 8) AFTER latitude;

-- Add facility_type column (Hospital, Clinic, Health Center, etc.)
ALTER TABLE hospitals 
ADD COLUMN facility_type VARCHAR(100) AFTER longitude;

-- Add ownership column (Government/Private)
ALTER TABLE hospitals 
ADD COLUMN ownership VARCHAR(50) AFTER facility_type;

-- Add pincode column
ALTER TABLE hospitals 
ADD COLUMN pincode VARCHAR(10) AFTER city;

-- Add specializations column
ALTER TABLE hospitals 
ADD COLUMN specializations TEXT AFTER ownership;

-- Add data_source tracking
ALTER TABLE hospitals 
ADD COLUMN data_source VARCHAR(50) DEFAULT 'Manual' AFTER specializations;

-- Add indexes for better search performance
CREATE INDEX idx_city ON hospitals(city);
CREATE INDEX idx_state ON hospitals(state);
CREATE INDEX idx_pincode ON hospitals(pincode);
CREATE INDEX idx_facility_type ON hospitals(facility_type);
CREATE INDEX idx_data_source ON hospitals(data_source);

-- Show updated structure
DESCRIBE hospitals;

-- Count existing hospitals
SELECT COUNT(*) as existing_hospitals FROM hospitals;
