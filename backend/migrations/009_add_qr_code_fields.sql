-- Migration: Add QR code and verification fields to prescriptions
-- File: 009_add_qr_code_fields.sql

-- Add verification and QR code fields to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN verification_code VARCHAR(50) UNIQUE,
ADD COLUMN qr_code_data TEXT,
ADD COLUMN is_dispensed BOOLEAN DEFAULT FALSE,
ADD COLUMN dispensed_at DATETIME,
ADD COLUMN dispensed_by VARCHAR(255),
ADD COLUMN dispensed_pharmacy VARCHAR(255),
ADD INDEX idx_verification_code (verification_code);

-- Create prescription_verifications table for audit trail
CREATE TABLE prescription_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT UNSIGNED NOT NULL,
    verification_code VARCHAR(50) NOT NULL,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(255),
    pharmacy_name VARCHAR(255),
    ip_address VARCHAR(45),
    action ENUM('view', 'dispense') NOT NULL DEFAULT 'view',
    notes TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    INDEX idx_prescription_id (prescription_id),
    INDEX idx_verification_code (verification_code),
    INDEX idx_verified_at (verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
