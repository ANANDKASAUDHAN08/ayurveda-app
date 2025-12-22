-- Add user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    
    -- Appearance settings
    theme VARCHAR(10) DEFAULT 'light',
    font_size INT DEFAULT 14,
    compact_mode BOOLEAN DEFAULT FALSE,
    reduce_motion BOOLEAN DEFAULT FALSE,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    promotion_notifications BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    
    -- Language & Region settings
    language VARCHAR(5) DEFAULT 'en',
    date_format VARCHAR(15) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(5) DEFAULT '12h',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(5) DEFAULT 'INR',
    
    -- Preferences
    auto_refresh BOOLEAN DEFAULT TRUE,
    remember_search BOOLEAN DEFAULT TRUE,
    search_radius INT DEFAULT 10,
    share_usage_data BOOLEAN DEFAULT FALSE,
    location_tracking BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
