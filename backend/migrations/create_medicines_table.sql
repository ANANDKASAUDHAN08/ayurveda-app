-- Create medicines table for real Indian medicine dataset
-- Source: GitHub - Indian Medicine Dataset (400k+ medicines)

CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    manufacturer VARCHAR(255),
    price DECIMAL(10, 2),
    type VARCHAR(100),
    composition TEXT,
    pack_size VARCHAR(100),
    mrp DECIMAL(10, 2),
    category VARCHAR(100),
    data_source VARCHAR(50) DEFAULT 'Indian-Medicine-Dataset',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name(255)),
    INDEX idx_manufacturer (manufacturer),
    INDEX idx_type (type),
    INDEX idx_category (category),
    FULLTEXT INDEX idx_fulltext_search (name, composition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create medicine images table (for future)
CREATE TABLE IF NOT EXISTS medicine_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    image_url VARCHAR(500),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_medicine_id (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Show table structure
DESCRIBE medicines;
