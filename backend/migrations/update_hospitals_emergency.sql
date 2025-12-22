-- Step 1: Add missing columns to hospitals table
ALTER TABLE hospitals
ADD COLUMN emergency_phone VARCHAR(20) AFTER phone,
ADD COLUMN type ENUM('government', 'private') DEFAULT 'private' AFTER specialties,
ADD COLUMN has_emergency BOOLEAN DEFAULT true AFTER type,
ADD COLUMN has_ambulance BOOLEAN DEFAULT false AFTER has_emergency,
ADD COLUMN has_icu BOOLEAN DEFAULT false AFTER has_ambulance,
ADD COLUMN beds_available INT DEFAULT 0 AFTER has_icu;

-- Step 2: Insert sample hospital data (Delhi/NCR area - change coordinates for your location)
-- Note: Adjust latitude/longitude for your actual location

INSERT INTO hospitals (name, address, city, state, pincode, phone, emergency_phone, email, specialties, facilities, type, has_emergency, has_ambulance, has_icu, beds_available, rating, latitude, longitude, is_active) VALUES

-- Government Hospitals
('AIIMS Delhi', 'Ansari Nagar, Sri Aurobindo Marg', 'New Delhi', 'Delhi', '110029', '011-26588500', '011-26588700', 'info@aiims.edu', 'Multi-specialty', 'Emergency, ICU, Trauma Center', 'government', 1, 1, 1, 120, 4.50, 28.5672319, 77.2100318, 1),

('Ram Manohar Lohia Hospital', 'Baba Kharak Singh Marg', 'New Delhi', 'Delhi', '110001', '011-23404242', '011-23365525', 'rml@nic.in', 'Multi-specialty', 'Emergency, ICU, Ambulance', 'government', 1, 1, 1, 100, 4.20, 28.6315789, 77.2075479, 1),

('Safdarjung Hospital', 'Safdarjung Enclave', 'New Delhi', 'Delhi', '110029', '011-26165060', '011-26165070', 'vmmc@nic.in', 'Multi-specialty', 'Emergency, Trauma, ICU', 'government', 1, 1, 1, 150, 4.30, 28.5677062, 77.2053707, 1),

('Dr. RML Hospital', 'Park Street', 'New Delhi', 'Delhi', '110055', '011-23365525', '011-23363738', 'drmlh@nic.in', 'General Medicine, Surgery', 'Emergency, ICU', 'government', 1, 1, 1, 80, 4.10, 28.6315789, 77.2089463, 1),

('Lok Nayak Hospital', 'Jawaharlal Nehru Marg', 'New Delhi', 'Delhi', '110002', '011-23232444', '011-23232555', 'lnjp@nic.in', 'Multi-specialty', 'Emergency, Trauma', 'government', 1, 1, 1, 200, 4.00, 28.6404753, 77.2348355, 1),

-- Private Hospitals
('Max Super Specialty Hospital', 'Press Enclave Road, Saket', 'New Delhi', 'Delhi', '110017', '011-26515050', '011-26515100', 'info@maxhealthcare.com', 'Multi-specialty, Cardiology, Neurology', 'Emergency, ICU, Ambulance, Advanced Diagnostics', 'private', 1, 1, 1, 90, 4.70, 28.5244084, 77.2066995, 1),

('Fortis Hospital', 'Sector 62, Noida', 'Noida', 'Uttar Pradesh', '201301', '0120-4785400', '0120-4785444', 'fortis@fortishealthcare.com', 'Cardiology, Oncology, Orthopedics', 'Emergency, ICU, Ambulance', 'private', 1, 1, 1, 85, 4.60, 28.6263877, 77.3671169, 1),

('Apollo Hospital', 'Mathura Road, Jasola', 'New Delhi', 'Delhi', '110076', '011-29871000', '011-29871090', 'apollo@apollohospitals.com', 'Multi-specialty, Cardiology, Neurology', 'Emergency, ICU, Trauma Center', 'private', 1, 1, 1, 100, 4.80, 28.5355161, 77.2829312, 1),

('Medanta The Medicity', 'Sector 38, Gurgaon', 'Gurgaon', 'Haryana', '122001', '0124-4141414', '0124-4141500', 'info@medanta.org', 'Multi-specialty, Heart Institute', 'Emergency, ICU, Air Ambulance', 'private', 1, 1, 1, 150, 4.90, 28.4421108, 77.0633833, 1),

('BLK Super Specialty Hospital', 'Pusa Road, Rajendra Place', 'New Delhi', 'Delhi', '110005', '011-30403040', '011-30403050', 'info@blkhospital.com', 'Multi-specialty, Oncology', 'Emergency, ICU, Ambulance', 'private', 1, 1, 1, 75, 4.50, 28.6424768, 77.1782134, 1),

('Artemis Hospital', 'Sector 51, Gurgaon', 'Gurgaon', 'Haryana', '122001', '0124-4511111', '0124-4511000', 'info@artemishospitals.com', 'Multi-specialty, Oncology, Orthopedics', 'Emergency, ICU, Advanced Imaging', 'private', 1, 1, 1, 80, 4.60, 28.4223702, 77.0752153, 1),

('Sir Ganga Ram Hospital', 'Rajinder Nagar', 'New Delhi', 'Delhi', '110060', '011-25750000', '011-42254000', 'sgrh@sgrh.com', 'Multi-specialty, Nephrology', 'Emergency, ICU, Dialysis', 'private', 1, 1, 1, 95, 4.70, 28.6384348, 77.1929369, 1),

('Indraprastha Apollo Hospital', 'Mathura Road, Sarita Vihar', 'New Delhi', 'Delhi', '110076', '011-71791090', '011-71791000', 'apollo.delhi@apollohospitals.com', 'Multi-specialty, Cardiology, Neurosurgery', 'Emergency, ICU, NICU', 'private', 1, 1, 1, 110, 4.80, 28.5428476, 77.2839327, 1),

('Primus Super Specialty Hospital', 'Chandragupt Marg, Chanakyapuri', 'New Delhi', 'Delhi', '110021', '011-46211111', '011-46211000', 'info@primushospital.com', 'Multi-specialty, Orthopedics, Gastro', 'Emergency, ICU, Ambulance', 'private', 1, 1, 1, 70, 4.40, 28.5984516, 77.1819547, 1),

('Manipal Hospital', 'Sector 6, Dwarka', 'New Delhi', 'Delhi', '110075', '011-45341234', '011-45341000', 'dwarka@manipalhospitals.com', 'Multi-specialty, Nephrology, Urology', 'Emergency, ICU, Dialysis', 'private', 1, 1, 1, 65, 4.50, 28.5921359, 77.0568575, 1);

-- Verification query
SELECT COUNT(*) as hospital_count FROM hospitals WHERE has_emergency = 1;
