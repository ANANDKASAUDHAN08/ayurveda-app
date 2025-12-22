-- Create hospitals table for emergency services
CREATE TABLE IF NOT EXISTS hospitals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) DEFAULT 'Maharashtra',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20),
  emergency_phone VARCHAR(20),
  type ENUM('government', 'private') DEFAULT 'private',
  has_emergency BOOLEAN DEFAULT true,
  has_ambulance BOOLEAN DEFAULT false,
  has_icu BOOLEAN DEFAULT false,
  beds_available INT DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_location (latitude, longitude),
  INDEX idx_type (type),
  INDEX idx_emergency (has_emergency)
);

-- Insert sample hospital data (Mumbai area - adjust coordinates as needed)
INSERT INTO hospitals (name, address, city, latitude, longitude, phone, emergency_phone, type, has_emergency, has_ambulance, has_icu, beds_available, rating) VALUES
-- Government Hospitals
('KEM Hospital', 'Acharya Donde Marg, Parel East, Mumbai', 'Mumbai', 19.0030, 72.8440, '022-24107000', '108', 'government', true, true, true, 50, 4.5),
('Sion Hospital', 'Sion West, Mumbai', 'Mumbai', 19.0430, 72.8610, '022-24076101', '108', 'government', true, true, true, 45, 4.3),
('Cooper Hospital', 'Juhu, Vile Parle West, Mumbai', 'Mumbai', 19.1200, 72.8360, '022-26207254', '108', 'government', true, true, true, 40, 4.4),
('Nair Hospital', 'Dr. Anandrao Nair Marg, Mumbai Central', 'Mumbai', 18.9690, 72.8200, '022-23027643', '108', 'government', true, true, true, 55, 4.2),
('JJ Hospital', 'Byculla, Mumbai', 'Mumbai', 18.9820, 72.8310, '022-23735555', '108', 'government', true, true, true, 60, 4.1),

-- Private Hospitals
('Lilavati Hospital', 'A-791, Bandra Reclamation, Bandra West, Mumbai', 'Mumbai', 19.0550, 72.8260, '022-26567891', '022-26562222', 'private', true, true, true, 35, 4.8),
('Hinduja Hospital', 'Veer Savarkar Marg, Mahim, Mumbai', 'Mumbai', 19.0390, 72.8400, '022-24447000', '022-24445000', 'private', true, true, true, 40, 4.7),
('Breach Candy Hospital', 'Bhulabhai Desai Road, Breach Candy, Mumbai', 'Mumbai', 18.9650, 72.8040, '022-23667788', '022-23667777', 'private', true, true, true, 30, 4.6),
('Jaslok Hospital', 'Dr. Gopal Pal Deshmukh Marg, Pedder Road, Mumbai', 'Mumbai', 18.9610, 72.8090, '022-66573333', '022-66573434', 'private', true, true, true, 38, 4.7),
('Kokilaben Hospital', 'Achyutrao Patwardhan Marg, Four Bungalows, Andheri West', 'Mumbai', 19.1310, 72.8260, '022-42696969', '022-42696868', 'private', true, true, true, 42, 4.9),
('Fortis Hospital', 'Mulund Goregaon Link Road, Mulund West, Mumbai', 'Mumbai', 19.1730, 72.9560, '022-67914444', '022-67914567', 'private', true, true, true, 45, 4.6),
('Holy Family Hospital', 'St Andrew Road, Bandra West, Mumbai', 'Mumbai', 19.0550, 72.8270, '022-26511111', '022-26512222', 'private', true, true, true, 28, 4.5),
('Wockhardt Hospital', 'Mira Road, Mumbai', 'Mumbai', 19.2840, 72.8650, '022-67666666', '022-67667777', 'private', true, true, true, 35, 4.4),
('SevenHills Hospital', 'Marol Maroshi Road, Andheri East, Mumbai', 'Mumbai', 19.1250, 72.8760, '022-66986666', '022-66987777', 'private', true, true, true, 33, 4.5),
('Asian Heart Institute', 'G/N Block, Bandra Kurla Complex, Bandra East', 'Mumbai', 19.0640, 72.8700, '022-66986666', '022-66987777', 'private', true, true, true, 25, 4.8);

-- Note: Coordinates are approximate. Replace with actual GPS coordinates for your area.
