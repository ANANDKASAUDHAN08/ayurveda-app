-- Admin Panel Database Migration
-- Creates tables for admin content management system
-- Run this file to set up the admin database schema

-- =============================================
-- 1. Users table already has role column, skip
-- =============================================
-- Role column already exists in users table

-- =============================================
-- 2. Featured Doctors Table
-- Stores doctors featured on home page
-- =============================================
CREATE TABLE IF NOT EXISTS featured_doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);

-- =============================================
-- 3. Health Articles Table
-- Stores health tips and articles
-- =============================================
CREATE TABLE IF NOT EXISTS health_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    image_url VARCHAR(500),
    author VARCHAR(100),
    category VARCHAR(50),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_published (is_published),
    INDEX idx_category (category),
    INDEX idx_created (created_at)
);

-- =============================================
-- 4. Hospitals Table
-- Hospital directory
-- =============================================
CREATE TABLE IF NOT EXISTS hospitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialties TEXT,
    facilities TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_active (is_active),
    INDEX idx_rating (rating)
);

-- =============================================
-- 5. Pharmacies Table
-- Pharmacy directory
-- =============================================
CREATE TABLE IF NOT EXISTS pharmacies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_24x7 BOOLEAN DEFAULT false,
    delivery_available BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_24x7 (is_24x7),
    INDEX idx_delivery (delivery_available),
    INDEX idx_active (is_active)
);

-- =============================================
-- 6. Static Pages Table
-- Policy pages and static content
-- =============================================
CREATE TABLE IF NOT EXISTS static_pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    meta_description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_slug (slug)
);

-- =============================================
-- Insert default static pages
-- =============================================
INSERT INTO static_pages (slug, title, content, meta_description) VALUES
('privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy describes how we collect, use, and protect your information.</p>', 'HealthConnect Privacy Policy'),
('terms-of-service', 'Terms of Service', '<h1>Terms of Service</h1><p>By using HealthConnect, you agree to these terms and conditions.</p>', 'HealthConnect Terms of Service'),
('cookie-policy', 'Cookie Policy', '<h1>Cookie Policy</h1><p>We use cookies to improve your experience on our platform.</p>', 'HealthConnect Cookie Policy'),
('hipaa-compliance', 'HIPAA Compliance', '<h1>HIPAA Compliance</h1><p>HealthConnect is committed to protecting your health information in accordance with HIPAA regulations.</p>', 'HIPAA Compliance Information')
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content),
    meta_description = VALUES(meta_description);

COMMIT;
