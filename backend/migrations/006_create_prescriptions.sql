-- Migration: Create Prescriptions System Tables
-- Created: 2025-12-21
-- Description: Tables for prescription management system

-- Table 1: Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
  prescription_type VARCHAR(20) NOT NULL CHECK (prescription_type IN ('uploaded', 'digital')),
  upload_file_path VARCHAR(500),
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'expired', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Prescription Medicines
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id SERIAL PRIMARY KEY,
  prescription_id INT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  quantity INT,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Prescription Refills
CREATE TABLE IF NOT EXISTS prescription_refills (
  id SERIAL PRIMARY KEY,
  prescription_id INT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  requested_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INT REFERENCES doctors(id) ON DELETE SET NULL,
  approved_date TIMESTAMP,
  rejection_reason TEXT,
  notes TEXT
);

-- Indexes for better performance
CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_expiry_date ON prescriptions(expiry_date);
CREATE INDEX idx_prescription_medicines_prescription_id ON prescription_medicines(prescription_id);
CREATE INDEX idx_prescription_refills_prescription_id ON prescription_refills(prescription_id);
CREATE INDEX idx_prescription_refills_status ON prescription_refills(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prescription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_prescription_timestamp
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_prescription_updated_at();

-- Sample data for testing
INSERT INTO prescriptions (user_id, doctor_id, prescription_type, issue_date, expiry_date, status, notes)
VALUES 
  (1, 1, 'digital', '2025-12-20', '2026-01-20', 'active', 'Post-consultation prescription'),
  (1, 2, 'uploaded', '2025-12-15', '2026-01-15', 'verified', 'Uploaded from physical prescription');

INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
VALUES
  (1, 'Amoxicillin', '500mg', 'Three times daily', '7 days', 21, 'Take after meals'),
  (1, 'Paracetamol', '650mg', 'As needed', '5 days', 10, 'For fever or pain'),
  (2, 'Ibuprofen', '400mg', 'Twice daily', '10 days', 20, 'Take with food');

COMMENT ON TABLE prescriptions IS 'Stores all prescriptions (uploaded and digital)';
COMMENT ON TABLE prescription_medicines IS 'Stores medicines associated with prescriptions';
COMMENT ON TABLE prescription_refills IS 'Tracks prescription refill requests and approvals';
