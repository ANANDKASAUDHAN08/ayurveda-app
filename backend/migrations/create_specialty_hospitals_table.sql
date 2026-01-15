CREATE TABLE IF NOT EXISTS hospitals_with_specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(100),
    city VARCHAR(100),
    hospital_name VARCHAR(255),
    hospital_type VARCHAR(50),
    hospital_system VARCHAR(50),
    address TEXT,
    pincode VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    specialties TEXT,
    facilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_state (state)
);
