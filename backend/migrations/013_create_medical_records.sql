-- ============================================
-- Migration: Create Medical Records and Allopathy Enhancements
-- Version: 013
-- Description: Adds medical_records table and diagnostic hub support
-- ============================================

-- Step 1: Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NULL,
    type ENUM('prescription', 'lab_report', 'radiology', 'discharge_summary', 'immunization') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    record_date DATE NOT NULL,
    file_url VARCHAR(500),
    status ENUM('active', 'archived', 'shared') DEFAULT 'active',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    INDEX idx_user_records (user_id),
    INDEX idx_record_type (type),
    INDEX idx_record_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create health_packages table (Grouped Lab Tests)
CREATE TABLE IF NOT EXISTS health_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    includes_tests TEXT, -- JSON or Comma separated test names
    image_url VARCHAR(500),
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Insert initial Allopathy Health Packages
INSERT INTO health_packages (name, description, price, discounted_price, includes_tests, is_popular)
VALUES 
('Executive Health Scan', 'Comprehensive full-body evaluation for professionals.', 4999.00, 2999.00, 'CBC, Lipid Profile, LFT, KFT, Vitamin D, HbA1c', TRUE),
('Cardiac Precision Pack', 'Advanced screening for heart health and risk markers.', 3499.00, 1999.00, 'Lipid Profile, hs-CRP, Homocysteine, Apo B', TRUE),
('Diabetes Management', 'Essential tests for monitoring and managing blood sugar.', 1299.00, 799.00, 'HbA1c, Fasting Glucose, Urine Routine', FALSE);

-- Step 4: Add metadata to lab_tests for better frontend categorization
ALTER TABLE lab_tests ADD COLUMN parameters_list JSON AFTER report_time;
ALTER TABLE lab_tests ADD COLUMN clinical_utility TEXT AFTER description;

-- Migration Complete
