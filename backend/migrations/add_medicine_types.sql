-- Migration: Add Medicine Types Table and Update Doctors Table
-- Date: 2025-12-20
-- Purpose: Enable filtering by medicine type (Ayurveda, Homeopathy, Allopathy)

-- Create medicine_types table
CREATE TABLE IF NOT EXISTS medicine_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default medicine types
INSERT INTO medicine_types (id, name, description, icon, color) VALUES
(1, 'Ayurveda', 'Traditional Indian medicine system focusing on natural healing and holistic wellness', 'fa-leaf', '#10b981'),
(2, 'Homeopathy', 'Alternative medicine system based on the principle of "like cures like"', 'fa-flask', '#3b82f6'),
(3, 'Allopathy', 'Conventional western medicine using drugs and surgery', 'fa-pills', '#ef4444')
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    icon = VALUES(icon),
    color = VALUES(color);

-- Add medicine_type_id column to doctors table (if not exists)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS medicine_type_id INT DEFAULT 1,
ADD CONSTRAINT fk_doctors_medicine_type 
    FOREIGN KEY (medicine_type_id) 
    REFERENCES medicine_types(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_medicine_type ON doctors(medicine_type_id);

-- Add medicine_type_id to appointments table for tracking
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS medicine_type_id INT,
ADD CONSTRAINT fk_appointments_medicine_type 
    FOREIGN KEY (medicine_type_id) 
    REFERENCES medicine_types(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_appointments_medicine_type ON appointments(medicine_type_id);

-- Update existing doctors to have Ayurveda as default (id = 1)
UPDATE doctors 
SET medicine_type_id = 1 
WHERE medicine_type_id IS NULL;

-- Migration complete
SELECT 'Medicine types migration completed successfully' AS status;
