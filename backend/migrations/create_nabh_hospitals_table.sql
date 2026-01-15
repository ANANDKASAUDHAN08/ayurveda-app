CREATE TABLE IF NOT EXISTS nabh_hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    state VARCHAR(100),
    contact VARCHAR(100),
    acc_no VARCHAR(100) UNIQUE,
    status VARCHAR(50),
    category VARCHAR(100),
    specialties JSON,
    certificate_link TEXT,
    website TEXT,
    extracted_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (state),
    INDEX (category),
    INDEX (acc_no)
);

ALTER TABLE nabh_hospitals MODIFY COLUMN name TEXT;

