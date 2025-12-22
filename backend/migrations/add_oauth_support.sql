-- UPDATED Migration for Single Users Table with Role Column
-- Add OAuth columns to users table only

ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50),
ADD COLUMN oauth_id VARCHAR(255),
ADD COLUMN avatar_url VARCHAR(500);

-- Make password optional (for OAuth-only users)
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Create index for OAuth lookups
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- Verify the changes
SELECT 'OAuth columns added to users table successfully' AS status;
