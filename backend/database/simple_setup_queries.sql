-- ============================================
-- SIMPLE SQL QUERIES FOR MYSQL WORKBENCH
-- Copy and paste these directly into MySQL Workbench
-- ============================================

-- STEP 1: ALTER appointments table
-- ============================================

ALTER TABLE appointments ADD COLUMN patient_age INT AFTER notes;
ALTER TABLE appointments ADD COLUMN patient_gender ENUM('male', 'female', 'other') AFTER patient_age;
ALTER TABLE appointments ADD COLUMN reason TEXT AFTER patient_gender;
ALTER TABLE appointments ADD COLUMN doctor_notes TEXT AFTER reason;
ALTER TABLE appointments ADD COLUMN prescription_id INT AFTER doctor_notes;
ALTER TABLE appointments ADD COLUMN payment_id VARCHAR(255) AFTER prescription_id;
ALTER TABLE appointments ADD COLUMN payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending' AFTER payment_id;
ALTER TABLE appointments ADD COLUMN amount DECIMAL(10, 2) AFTER payment_status;
ALTER TABLE appointments ADD COLUMN consultation_type ENUM('video', 'audio', 'chat') DEFAULT 'video' AFTER amount;

-- Add indexes
ALTER TABLE appointments ADD INDEX idx_payment_status (payment_status);
ALTER TABLE appointments ADD INDEX idx_consultation_type (consultation_type);

SELECT 'appointments table updated!' as Status;


-- STEP 2: ALTER doctors table
-- ============================================

ALTER TABLE doctors ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00 AFTER consultationFee;
ALTER TABLE doctors ADD COLUMN total_consultations INT DEFAULT 0 AFTER rating;
ALTER TABLE doctors ADD COLUMN is_available TINYINT(1) DEFAULT 1 AFTER isVerified;

-- Add indexes
ALTER TABLE doctors ADD INDEX idx_rating (rating);
ALTER TABLE doctors ADD INDEX idx_available (is_available);

SELECT 'doctors table updated!' as Status;


-- STEP 3: Clean up existing doctors (keep first 2)
-- ============================================

-- First, see what you have
SELECT id, name, specialization, location FROM doctors ORDER BY id;

-- Delete all except first 2
DELETE FROM doctors 
WHERE id NOT IN (
    SELECT * FROM (
        SELECT id FROM doctors ORDER BY id LIMIT 2
    ) as temp
);

-- Clean up orphaned availability slots
DELETE FROM doctor_availability 
WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Verify cleanup
SELECT COUNT(*) as remaining_doctors FROM doctors;
SELECT id, name, specialization FROM doctors;

SELECT 'Cleanup complete! Ready to import new doctors.' as Status;
