-- ============================================
-- Migration: Add Medicine Type System
-- Version: 012
-- Description: Adds medicine_type ENUM to support
--              Ayurveda, Homeopathy, and Allopathy
--              filtering throughout the application
-- ============================================

-- Step 1: Add medicine_type to doctors table
-- Default to 'allopathy' for backward compatibility
ALTER TABLE doctors
ADD COLUMN medicine_type ENUM('ayurveda', 'homeopathy', 'allopathy') 
DEFAULT 'allopathy' 
NOT NULL
AFTER specialization;

-- Step 2: Add medicine_type to medicines table
ALTER TABLE medicines
ADD COLUMN medicine_type ENUM('ayurveda', 'homeopathy', 'allopathy') 
DEFAULT 'allopathy' 
NOT NULL
AFTER category;

-- Step 3: Add medicine_type to appointments table
-- This tracks which system the appointment is for
ALTER TABLE appointments
ADD COLUMN medicine_type ENUM('ayurveda', 'homeopathy', 'allopathy') 
DEFAULT 'allopathy' 
NOT NULL
AFTER status;

-- Step 4: Create user_medicine_preference table
-- Stores user's preferred medicine type
CREATE TABLE IF NOT EXISTS user_medicine_preference (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preferred_type ENUM('ayurveda', 'homeopathy', 'allopathy', 'all') DEFAULT 'all',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create medicine_type_content table
-- Stores type-specific articles, tips, practices
CREATE TABLE IF NOT EXISTS medicine_type_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_type ENUM('ayurveda', 'homeopathy', 'allopathy') NOT NULL,
    content_type ENUM('article', 'practice', 'tip', 'guide') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    author VARCHAR(100),
    tags JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_medicine_type (medicine_type),
    INDEX idx_content_type (content_type),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Add indexes for better query performance
ALTER TABLE doctors ADD INDEX idx_medicine_type (medicine_type);
ALTER TABLE medicines ADD INDEX idx_medicine_type (medicine_type);
ALTER TABLE appointments ADD INDEX idx_medicine_type (medicine_type);

-- Step 7: Categorize existing doctors based on specialization
-- This intelligently assigns types based on current data
UPDATE doctors SET medicine_type = 'ayurveda'
WHERE 
    LOWER(specialization) LIKE '%ayurved%' 
    OR LOWER(specialization) LIKE '%herbal%'
    OR LOWER(specialization) LIKE '%vaidya%'
    OR LOWER(specialization) LIKE '%panchakarma%';

UPDATE doctors SET medicine_type = 'homeopathy'
WHERE 
    LOWER(specialization) LIKE '%homeopath%'
    OR LOWER(specialization) LIKE '%homoeo%';

-- Remaining doctors stay as 'allopathy' (default)

-- Step 8: Categorize existing medicines based on category
UPDATE medicines SET medicine_type = 'ayurveda'
WHERE 
    LOWER(category) LIKE '%ayurved%'
    OR LOWER(category) LIKE '%herbal%'
    OR LOWER(category) LIKE '%traditional%'
    OR LOWER(name) LIKE '%churna%'
    OR LOWER(name) LIKE '%kashaya%'
    OR LOWER(name) LIKE '%ghrita%'
    OR LOWER(name) LIKE '%thailam%';

UPDATE medicines SET medicine_type = 'homeopathy'
WHERE 
    LOWER(category) LIKE '%homeopath%'
    OR LOWER(category) LIKE '%homoeo%'
    OR LOWER(name) LIKE '%dilution%'
    OR LOWER(name) LIKE '%mother tincture%';

-- Remaining medicines stay as 'allopathy' (default)

-- Step 9: Insert sample type-specific content

-- Ayurveda Content
INSERT INTO medicine_type_content 
(medicine_type, content_type, title, description, content, image_url, author, tags, is_featured) 
VALUES
('ayurveda', 'article', 'Understanding Your Dosha: A Beginner\'s Guide', 
 'Learn about the three doshas - Vata, Pitta, and Kapha - and how they influence your health.',
 'Ayurveda teaches us that each person has a unique constitution made up of three fundamental energies called doshas: Vata (air and space), Pitta (fire and water), and Kapha (earth and water). Understanding your dominant dosha can help you make better lifestyle and dietary choices...', 
 '/assets/images/doshas.jpg', 
 'Dr. Rajesh Kumar', 
 '["dosha", "ayurveda", "wellness", "constitution"]',
 TRUE),

('ayurveda', 'practice', 'Morning Abhyanga (Oil Massage) Routine', 
 'A step-by-step guide to traditional Ayurvedic self-massage for daily wellness.',
 'Abhyanga, the practice of self-massage with warm oil, is a cornerstone of Ayurvedic daily routine. This practice nourishes the skin, calms the nervous system, and promotes detoxification. Here\'s how to do it: 1. Warm organic sesame oil... 2. Start with your scalp... 3. Move to your face...',
 '/assets/images/abhyanga.jpg', 
 'Dr. Priya Sharma', 
 '["abhyanga", "self-care", "massage", "daily-routine"]',
 TRUE),

('ayurveda', 'tip', 'Balance Your Agni (Digestive Fire)', 
 'Quick tips to maintain healthy digestion according to Ayurvedic principles.',
 'Strong Agni is key to good health. Tips: 1. Eat at regular times. 2. Avoid cold drinks with meals. 3. Include digestive spices like ginger and cumin. 4. Don\'t overeat. 5. Practice mindful eating.',
 '/assets/images/digestion.jpg', 
 'Vaidya Anand Patel', 
 '["digestion", "agni", "tips", "wellness"]',
 FALSE);

-- Homeopathy Content
INSERT INTO medicine_type_content 
(medicine_type, content_type, title, description, content, image_url, author, tags, is_featured) 
VALUES
('homeopathy', 'article', 'The Principle of Like Cures Like', 
 'Understanding the fundamental law of homeopathy and how it works.',
 'Homeopathy is based on the principle of "similia similibus curentur" - like cures like. This means a substance that causes symptoms in a healthy person can cure similar symptoms in a sick person when given in highly diluted form...',
 '/assets/images/homeopathy-principle.jpg', 
 'Dr. Sarah Johnson', 
 '["principles", "homeopathy", "healing", "philosophy"]',
 TRUE),

('homeopathy', 'guide', 'Choosing the Right Potency', 
 'A beginner\'s guide to understanding homeopathic potencies.',
 'Homeopathic remedies come in different potencies (6C, 30C, 200C, etc.). Here\'s what you need to know: Lower potencies (6C, 12C) are for acute, physical symptoms. Medium potencies (30C) are most common for home use. High potencies (200C+) are for chronic conditions...',
 '/assets/images/potency.jpg', 
 'Dr. Michael Brown', 
 '["potency", "guide", "remedies", "beginners"]',
 FALSE);

-- Allopathy Content
INSERT INTO medicine_type_content 
(medicine_type, content_type, title, description, content, image_url, author, tags, is_featured) 
VALUES
('allopathy', 'article', 'Understanding Antibiotic Resistance', 
 'Why proper antibiotic use is crucial for public health.',
 'Antibiotic resistance is one of the biggest public health challenges today. When bacteria evolve to resist antibiotics, common infections become harder to treat. Here\'s what you can do: 1. Only take antibiotics when prescribed... 2. Complete the full course... 3. Never share antibiotics...',
 '/assets/images/antibiotics.jpg', 
 'Dr. Emily Chen', 
 '["antibiotics", "resistance", "public-health", "education"]',
 TRUE),

('allopathy', 'tip', 'Managing Medication Side Effects', 
 'Tips for dealing with common medication side effects.',
 'Many medications have side effects. Here are tips to manage them: 1. Take with food if it causes stomach upset. 2. Stay hydrated. 3. Report severe side effects to your doctor. 4. Don\'t stop suddenly without consulting. 5. Keep a symptom diary.',
 '/assets/images/medications.jpg', 
 'Dr. Robert Taylor', 
 '["medication", "side-effects", "tips", "safety"]',
 FALSE);

-- Step 10: Create statistics view for medicine type dashboard
CREATE OR REPLACE VIEW medicine_type_stats AS
SELECT 
    'ayurveda' as medicine_type,
    (SELECT COUNT(*) FROM doctors WHERE medicine_type = 'ayurveda') as doctor_count,
    (SELECT COUNT(*) FROM medicines WHERE medicine_type = 'ayurveda' AND stock > 0) as medicine_count,
    (SELECT COUNT(*) FROM appointments WHERE medicine_type = 'ayurveda') as appointment_count,
    (SELECT COUNT(*) FROM medicine_type_content WHERE medicine_type = 'ayurveda') as content_count
UNION ALL
SELECT 
    'homeopathy' as medicine_type,
    (SELECT COUNT(*) FROM doctors WHERE medicine_type = 'homeopathy') as doctor_count,
    (SELECT COUNT(*) FROM medicines WHERE medicine_type = 'homeopathy' AND stock > 0) as medicine_count,
    (SELECT COUNT(*) FROM appointments WHERE medicine_type = 'homeopathy') as appointment_count,
    (SELECT COUNT(*) FROM medicine_type_content WHERE medicine_type = 'homeopathy') as content_count
UNION ALL
SELECT 
    'allopathy' as medicine_type,
    (SELECT COUNT(*) FROM doctors WHERE medicine_type = 'allopathy') as doctor_count,
    (SELECT COUNT(*) FROM medicines WHERE medicine_type = 'allopathy' AND stock > 0) as medicine_count,
    (SELECT COUNT(*) FROM appointments WHERE medicine_type = 'allopathy') as appointment_count,
    (SELECT COUNT(*) FROM medicine_type_content WHERE medicine_type = 'allopathy') as content_count;

-- ============================================
-- Migration Complete
-- ============================================
-- Summary of Changes:
-- 1. Added medicine_type column to doctors, medicines, appointments
-- 2. Created user_medicine_preference table
-- 3. Created medicine_type_content table
-- 4. Added indexes for performance
-- 5. Categorized existing data intelligently
-- 6. Inserted sample content for each type
-- 7. Created statistics view
--
-- Backward Compatibility: ✅
-- - All columns have DEFAULT values
-- - Existing queries work unchanged
-- - Optional filtering available
-- ============================================
