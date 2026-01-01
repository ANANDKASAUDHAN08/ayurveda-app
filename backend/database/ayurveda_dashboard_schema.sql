-- ============================================
-- AYURVEDA DASHBOARD - DATABASE SCHEMA
-- Medicines, Exercises, and Articles
-- ============================================

-- 1. Ayurveda Medicines Table
CREATE TABLE IF NOT EXISTS ayurveda_medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    benefits TEXT,
    is_bestseller BOOLEAN DEFAULT FALSE,
    stock_status VARCHAR(50) DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Medicines
INSERT INTO ayurveda_medicines (name, description, price, image_url, category, benefits, is_bestseller) VALUES
('Ashwagandha Root Powder', 'For stress relief & vitality', 450.00, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', 'Herbs', 'Reduces stress, boosts energy, improves focus', TRUE),
('Triphala Churna', 'Digestive health & detox', 450.00, 'https://images.unsplash.com/photo-1605857867126-f8a5e52cb55a?w=400', 'Digestive', 'Improves digestion, detoxifies body, boosts immunity', FALSE),
('Brahmi Tablets', 'Memory & focus enhancer', 450.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 'Brain Health', 'Enhances memory, reduces anxiety, promotes mental clarity', FALSE),
('Chyawanprash', 'Immunity booster & vitality', 550.00, 'https://images.unsplash.com/photo-1556910110-a5a63dfd393c?w=400', 'Immunity', 'Boosts immunity, increases energy, promotes longevity', TRUE),
('Tulsi Drops', 'Natural immunity & wellness', 350.00, 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400', 'Immunity', 'Antibacterial, antiviral, stress relief', FALSE),
('Arjuna Bark Powder', 'Heart health support', 480.00, 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400', 'Cardiovascular', 'Supports heart health, regulates BP, strengthens heart muscles', FALSE);

-- 2. Ayurveda Exercises/Yoga Table
CREATE TABLE IF NOT EXISTS ayurveda_exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('yoga', 'pranayama', 'meditation') DEFAULT 'yoga',
    description TEXT,
    duration_minutes INT,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    image_url VARCHAR(500),
    benefits TEXT,
    steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Exercises
INSERT INTO ayurveda_exercises (name, type, description, duration_minutes, difficulty, image_url, benefits) VALUES
('Surya Namaskar', 'yoga', 'Complete body workout with 12 poses', 15, 'beginner', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 'Full body workout, improves flexibility, boosts metabolism'),
('Anulom Vilom', 'pranayama', 'Alternate nostril breathing technique', 10, 'intermediate', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', 'Reduces stress, balances doshas, improves focus'),
('Meditation', 'meditation', 'Mindfulness & inner peace practice', 20, 'beginner', 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400', 'Mental clarity, stress relief, emotional balance'),
('Kapalbhati', 'pranayama', 'Skull-shining breath technique', 15, 'intermediate', 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400', 'Detoxifies body, improves digestion, increases energy'),
('Bhastrika', 'pranayama', 'Bellows breath - powerful breathing', 12, 'advanced', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=400', 'Boosts metabolism, clears respiratory system'),
('Shavasana', 'yoga', 'Corpse pose - deep relaxation', 10, 'beginner', 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400', 'Complete relaxation, reduces fatigue, calms mind');

-- 3. Ayurveda Health Articles Table
CREATE TABLE IF NOT EXISTS ayurveda_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    excerpt TEXT,
    content LONGTEXT,
    image_url VARCHAR(500),
    author VARCHAR(255) DEFAULT 'Ayurveda Expert',
    read_time_minutes INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Articles
INSERT INTO ayurveda_articles (title, category, excerpt, image_url, read_time_minutes) VALUES
('Understanding Your Body Type', 'Doshas', 'Learn about Vata, Pitta, and Kapha doshas and discover your unique constitution...', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 8),
('Power of Ayurvedic Herbs', 'Herbs', 'Discover the healing properties of natural herbs used in Ayurveda for centuries...', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', 6),
('Ayurvedic Diet Medicines and Teas', 'Diet', 'Explore traditional Ayurvedic dietary practices and herbal teas for wellness...', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400', 7),
('Balancing Your Agni for Better Digestion', 'Health', 'Understanding digestive fire and how to maintain optimal digestion...', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', 10),
('Seasonal Ayurvedic Practices', 'Lifestyle', 'Adapt your routine according to seasons for optimal health and balance...', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', 6),
('Pranayama for Modern Life', 'Wellness', 'Breathing techniques to manage stress and enhance vitality in daily life...', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', 8);

-- Verify data insertion
SELECT 'Medicines' as table_name, COUNT(*) as count FROM ayurveda_medicines
UNION ALL
SELECT 'Exercises', COUNT(*) FROM ayurveda_exercises
UNION ALL
SELECT 'Articles', COUNT(*) FROM ayurveda_articles;
