-- Create test admin user
-- Password will be 'admin123' (needs to be hashed in application)

INSERT INTO users (name, email, password, role, phone, created_at, updated_at) 
VALUES (
  'Admin User',
  'admin@healthconnect.com',
  '$2b$10$rHKvZ9Q7X8K3nYJZqGqGcO5y7vKjP3wJxKJzYXqYwXqYwXqYwXqYw', -- This is a placeholder, we'll use the app to hash
  'admin',
  '+1234567890',
  NOW(),
  NOW()
);

-- Verify admin user created
SELECT id, name, email, role FROM users WHERE role = 'admin';
