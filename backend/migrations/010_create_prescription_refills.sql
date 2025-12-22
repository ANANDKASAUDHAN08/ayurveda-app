-- Migration: Create prescription refills table
-- File: 010_create_prescription_refills.sql

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS refill_notifications;
DROP TABLE IF EXISTS prescription_refills;

-- Create prescription_refills table
CREATE TABLE prescription_refills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_prescription_id BIGINT UNSIGNED NOT NULL,
    new_prescription_id BIGINT UNSIGNED,
    requested_by INT NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    reason TEXT,
    preferred_pharmacy VARCHAR(255),
    patient_notes TEXT,
    doctor_notes TEXT,
    approved_by INT,
    approved_at DATETIME,
    rejected_reason TEXT,
    rejected_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    modifications JSON,
    FOREIGN KEY (original_prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (new_prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_original_prescription (original_prescription_id),
    INDEX idx_status (status),
    INDEX idx_requested_by (requested_by),
    INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create refill_notifications table
CREATE TABLE refill_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    refill_id BIGINT NOT NULL,
    recipient_id INT NOT NULL,
    notification_type ENUM('request', 'approval', 'rejection', 'completion', 'cancellation') NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    email_sent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (refill_id) REFERENCES prescription_refills(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipient (recipient_id),
    INDEX idx_read (read_at),
    INDEX idx_refill (refill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

