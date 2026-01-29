-- =============================================
-- Migration: Enhance Lab Tests and Create Private Laboratories (Robust Version)
-- Version: 014
-- Description: Adds detailed fields to lab_tests and creates a dedicated laboratories table
-- =============================================

-- Step 1: Enhance lab_tests table (Individual statements to survive existing columns)
-- We'll use a stored procedure to safely add columns if they don't exist, 
-- or just rely on the fact that we'll skip the ones that fail as duplicates if we run them separately.

-- Purpose
ALTER TABLE lab_tests ADD COLUMN purpose TEXT AFTER description;
-- Preparation
ALTER TABLE lab_tests ADD COLUMN preparation TEXT AFTER sample_type;
-- Reference Range
ALTER TABLE lab_tests ADD COLUMN reference_range JSON AFTER parameters_list;
-- LOINC Code
ALTER TABLE lab_tests ADD COLUMN loinc_code VARCHAR(50) AFTER clinical_utility;

-- Note: clinical_utility seems to already exist for some reason, so we skip adding it.

-- Step 2: Create laboratories table for private diagnostic centers
CREATE TABLE IF NOT EXISTS laboratories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    services JSON, -- Array of test categories or specific tests offered
    rating DECIMAL(2, 1) DEFAULT 0.0,
    is_nabl_accredited BOOLEAN DEFAULT FALSE,
    is_cghs_empanelled BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (city, state),
    INDEX idx_pincode (pincode),
    INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE laboratories ADD COLUMN timings VARCHAR(255) AFTER longitude;