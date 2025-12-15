-- Product Tables for Cart System
-- Permanent solution for medicines and medical devices

-- =====================================================
-- MEDICINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medicines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  manufacturer VARCHAR(255),
  category VARCHAR(100),
  prescription_required BOOLEAN DEFAULT false,
  stock INT DEFAULT 100,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEDICAL DEVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medical_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  manufacturer VARCHAR(255),
  category VARCHAR(100),
  stock INT DEFAULT 50,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category, price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE MEDICINES DATA
-- =====================================================
INSERT INTO medicines (name, description, price, mrp, manufacturer, category, prescription_required, image_url) VALUES
('Vitamin C Tablets', '60 tablets pack, Boosts immunity', 699, 999, 'HealthCare Ltd', 'Vitamins & Supplements', false, 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Vitamin+C'),
('Gentle Face Wash', 'For all skin types, 150ml', 149, 199, 'SkinCare Brand', 'Personal Care', false, 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Face+Wash'),
('Anti-Dandruff Shampoo', '200ml, Buy 2 Get 1 Free', 299, 450, 'HairCare Pro', 'Hair Care', false, 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Shampoo'),
('Paracetamol 500mg', 'Pain relief and fever reducer, 10 tablets', 20, 30, 'Generic Pharma', 'Pain Relief', false, 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Paracetamol'),
('Cough Syrup', 'Relief from cough and cold, 100ml', 85, 120, 'ColdCare Inc', 'Cold & Cough', false, 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Cough+Syrup'),
('Multivitamin', 'Daily multivitamin tablets, 30 count', 450, 600, 'VitaLife', 'Vitamins & Supplements', false, 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Multivitamin'),
('Hand Sanitizer', 'Kills 99.9% germs, 500ml', 120, 180, 'HygieneFirst', 'Personal Care', false, 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Sanitizer'),
('Omega-3 Capsules', 'Fish oil, 60 capsules', 850, 1200, 'NutriBoost', 'Vitamins & Supplements', false, 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Omega+3')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- SAMPLE MEDICAL DEVICES DATA
-- =====================================================
INSERT INTO medical_devices (name, description, price, mrp, manufacturer, category, image_url) VALUES
('Digital Thermometer', 'Quick and accurate temperature reading', 250, 400, 'MediTech', 'Diagnostic', 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Thermometer'),
('Blood Pressure Monitor', 'Automatic digital BP monitor', 1500, 2500, 'HealthMonitor Inc', 'Diagnostic', 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=BP+Monitor'),
('Pulse Oximeter', 'Measures oxygen saturation and pulse', 800, 1200, 'OxyMeter', 'Diagnostic', 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Oximeter'),
('Whey Protein 1kg', 'Chocolate flavor protein powder', 1499, 2499, 'FitPro', 'Fitness & Nutrition', 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Protein+Powder'),
('Nebulizer Machine', 'For respiratory treatments', 2200, 3500, 'RespiCare', 'Respiratory', 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Nebulizer')
ON DUPLICATE KEY UPDATE name = VALUES(name);
