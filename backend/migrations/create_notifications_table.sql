-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT NULL,
  related_type VARCHAR(50) NULL,
  action_url VARCHAR(500) NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  broadcast BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created (created_at DESC),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add some sample data for testing (optional)
INSERT INTO notifications (user_id, type, category, title, message, priority)
VALUES (1, 'system_update', 'system', 'Welcome!', 'Welcome to HealthConnect notification system', 'normal');
