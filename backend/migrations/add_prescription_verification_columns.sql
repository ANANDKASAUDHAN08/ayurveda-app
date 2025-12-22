-- Add verification tracking columns to prescriptions table
ALTER TABLE prescriptions
ADD COLUMN verified_by INT NULL AFTER status,
ADD COLUMN verified_at TIMESTAMP NULL AFTER verified_by,
ADD COLUMN verification_notes TEXT NULL AFTER verified_at,
ADD COLUMN rejection_reason TEXT NULL AFTER verification_notes,
ADD FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_verified_by ON prescriptions(verified_by);
CREATE INDEX idx_prescriptions_verified_at ON prescriptions(verified_at);
