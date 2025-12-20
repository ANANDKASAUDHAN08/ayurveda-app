-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN token_expires_at TIMESTAMP NULL;

-- Add indexes for faster token lookups
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Show current schema
DESCRIBE users;
