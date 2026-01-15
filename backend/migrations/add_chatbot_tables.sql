-- =========================================
-- CHATBOT & SUBSCRIPTION SYSTEM TABLES
-- Created: 2026-01-09
-- Purpose: Support chatbot functionality and freemium subscription model
-- =========================================

-- 1. Update users table with subscription fields
-- Note: Run these one at a time, or comment out columns that already exist
ALTER TABLE users 
ADD COLUMN subscription_tier ENUM('free', 'premium', 'premium_plus') DEFAULT 'free',
ADD COLUMN subscription_start_date DATETIME NULL,
ADD COLUMN subscription_end_date DATETIME NULL,
ADD COLUMN subscription_status ENUM('active', 'cancelled', 'expired', 'trial') DEFAULT 'active',
ADD COLUMN symptom_checks_this_month INT DEFAULT 0,
ADD COLUMN chat_messages_today INT DEFAULT 0,
ADD COLUMN last_reset_date DATE DEFAULT (CURRENT_DATE),
ADD COLUMN free_consultations_remaining INT DEFAULT 0,
ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN razorpay_customer_id VARCHAR(255) NULL;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tier ENUM('premium', 'premium_plus') NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'trial') DEFAULT 'active',
    payment_method VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle ENUM('monthly', 'yearly') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    stripe_subscription_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_end_date (end_date),
    INDEX idx_stripe_subscription (stripe_subscription_id),
    INDEX idx_razorpay_subscription (razorpay_subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    message_count INT DEFAULT 0,
    context JSON,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL,
    sender ENUM('user', 'bot') NOT NULL,
    message TEXT NOT NULL,
    intent VARCHAR(50),
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_sender (sender)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create symptom_history table (enhanced)
CREATE TABLE IF NOT EXISTS symptom_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symptoms JSON NOT NULL,
    diagnosis VARCHAR(100),
    confidence DECIMAL(5,2),
    treatment_type ENUM('ayurveda', 'allopathy', 'both') DEFAULT 'both',
    treatments JSON,
    age INT,
    gender ENUM('male', 'female', 'other'),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, checked_at),
    INDEX idx_diagnosis (diagnosis),
    INDEX idx_treatment_type (treatment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create usage_limits table
CREATE TABLE IF NOT EXISTS usage_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    symptom_checks INT DEFAULT 0,
    chat_messages INT DEFAULT 0,
    consultations INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_gateway ENUM('stripe', 'razorpay', 'paypal') NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_type ENUM('subscription', 'consultation', 'one_time') NOT NULL,
    metadata JSON,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_transaction (transaction_id),
    INDEX idx_payment_type (payment_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- DATA VERIFICATION
-- =========================================

-- Check if tables were created successfully
SELECT 
    'users' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users'
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'subscriptions'
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_sessions'
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'chat_messages'
UNION ALL
SELECT 'symptom_history', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'symptom_history'
UNION ALL
SELECT 'usage_limits', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'usage_limits'
UNION ALL
SELECT 'payments', COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments';

-- Migration complete!
