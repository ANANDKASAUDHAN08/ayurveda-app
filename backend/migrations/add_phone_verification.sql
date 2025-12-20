-- Add phone verification columns to users table
ALTER TABLE users 
ADD COLUMN phone VARCHAR(15),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN otp_code VARCHAR(6),
ADD COLUMN otp_expires_at TIMESTAMP NULL,
ADD COLUMN otp_attempts INT DEFAULT 0;

-- Add index for faster phone lookups
CREATE INDEX idx_users_phone ON users(phone);

-- Show updated schema
DESCRIBE users;
