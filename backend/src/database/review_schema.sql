-- =============================================
-- Review and Rating System Database Schema
-- =============================================

-- Hospital Reviews Table
CREATE TABLE IF NOT EXISTS hospital_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hospital_id INT NOT NULL,
    hospital_source ENUM('hospitals', 'nabh_hospitals', 'hospitals_with_specialties', 'health_centres') NOT NULL DEFAULT 'hospitals',
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255) DEFAULT NULL,
    comment TEXT NOT NULL,
    aspects JSON DEFAULT NULL COMMENT 'Optional: {"cleanliness": 5, "staff": 4, "facilities": 5, "waiting_time": 3}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_hospital_source (hospital_source),
    INDEX idx_hospital_composite (hospital_id, hospital_source),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website/Platform Reviews Table
CREATE TABLE IF NOT EXISTS website_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255) DEFAULT NULL,
    comment TEXT NOT NULL,
    category ENUM('general', 'ui_ux', 'features', 'performance', 'suggestion', 'bug_report') NOT NULL DEFAULT 'general',
    page_url VARCHAR(500) DEFAULT NULL COMMENT 'Optional: page where feedback was given',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pharmacy Reviews Table
CREATE TABLE IF NOT EXISTS pharmacy_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pharmacy_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255) DEFAULT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_pharmacy_id (pharmacy_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
