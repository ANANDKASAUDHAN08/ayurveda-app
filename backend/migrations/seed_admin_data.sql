-- Seed Data for Admin Content Management System
-- Run this after create_admin_tables.sql

-- =============================================
-- Seed Featured Doctors
-- Using existing doctors from the database
-- =============================================
INSERT INTO featured_doctors (doctor_id, display_order, is_active) VALUES
(1, 1, true),
(2, 2, true),
(3, 3, true)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- =============================================
-- Seed Health Articles
-- =============================================
INSERT INTO health_articles (title, excerpt, content, image_url, author, category, is_published) VALUES
(
    '10 Tips for Better Sleep',
    'Discover simple yet effective strategies to improve your sleep quality and wake up feeling refreshed.',
    '<h2>10 Tips for Better Sleep</h2><p>Getting quality sleep is essential for your health. Here are 10 evidence-based tips:</p><ul><li>Stick to a sleep schedule</li><li>Create a restful environment</li><li>Limit screen time before bed</li><li>Avoid caffeine late in the day</li><li>Exercise regularly</li></ul>',
    'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=400',
    'Dr. Sarah Johnson',
    'Wellness',
    true
),
(
    'Understanding Ayurvedic Medicine',
    'Learn about the ancient practice of Ayurveda and its modern applications in healthcare.',
    '<h2>Understanding Ayurvedic Medicine</h2><p>Ayurveda is a traditional system of medicine with historical roots in India. This article explores its principles and benefits.</p>',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    'Dr. Raj Patel',
    'Ayurveda',
    true
),
(
    'Heart Health: Prevention is Key',
    'Essential tips for maintaining cardiovascular health and preventing heart disease.',
    '<h2>Heart Health Matters</h2><p>Your heart works tirelessly for you. Learn how to take care of it through diet, exercise, and lifestyle changes.</p>',
    'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400',
    'Dr. Michael Chen',
    'Cardiology',
    true
);

-- =============================================
-- Seed Hospitals
-- =============================================
INSERT INTO hospitals (name, address, city, state, pincode, phone, email, specialties, facilities, rating, image_url, is_active) VALUES
(
    'City General Hospital',
    '123 Main Street, Central District',
    'Mumbai',
    'Maharashtra',
    '400001',
    '+91 22 1234 5678',
    '[email protected]',
    'Cardiology, Neurology, Orthopedics, Emergency Care',
    'ICU, NICU, Blood Bank, Pharmacy, Ambulance Service',
    4.5,
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    true
),
(
    'Sunrise Medical Center',
    '456 Health Avenue, North Zone',
    'Delhi',
    'Delhi',
    '110001',
    '+91 11 9876 5432',
    '[email protected]',
    'Pediatrics, Gynecology, Oncology, Radiology',
    'MRI, CT Scan, Laboratory, 24/7 Emergency',
    4.7,
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600',
    true
),
(
    'Green Valley Hospital',
    '789 Wellness Road, South Block',
    'Bangalore',
    'Karnataka',
    '560001',
    '+91 80 5555 6666',
    '[email protected]',
    'General Surgery, Ayurveda, Physiotherapy',
    'Operation Theater, Rehabilitation Center, Cafeteria',
    4.3,
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
    true
);

-- =============================================
-- Seed Pharmacies
-- =============================================
INSERT INTO pharmacies (name, address, city, state, pincode, phone, email, is_24x7, delivery_available, rating, image_url, is_active) VALUES
(
    'HealthPlus Pharmacy',
    '12 Medical Lane, Downtown',
    'Mumbai',
    'Maharashtra',
    '400002',
    '+91 22 8888 9999',
    '[email protected]',
    true,
    true,
    4.6,
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400',
    true
),
(
    'Care & Cure Medicals',
    '34 Wellness Street',
    'Delhi',
    'Delhi',
    '110002',
    '+91 11 7777 8888',
    '[email protected]',
    false,
    true,
    4.4,
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    true
),
(
    'MediQuick Store',
    '56 Health Plaza, BTM Layout',
    'Bangalore',
    'Karnataka',
    '560002',
    '+91 80 6666 7777',
    '[email protected]',
    true,
    true,
    4.8,
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
    true
),
(
    'WellCare Pharmacy',
    '78 Medicine Road, Indiranagar',
    'Bangalore',
    'Karnataka',
    '560003',
    '+91 80 9999 0000',
    '[email protected]',
    false,
    false,
    4.2,
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
    true
);

COMMIT;
