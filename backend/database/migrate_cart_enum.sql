-- Migration to add 'ayurveda_medicine' to product_type ENUMS
USE healthconnect;

-- 1. Update Cart Table
ALTER TABLE cart MODIFY COLUMN product_type ENUM('medicine', 'device', 'service', 'ayurveda_medicine', 'lab_test') NOT NULL;

-- 2. Update Order Items Table
ALTER TABLE order_items MODIFY COLUMN product_type ENUM('medicine', 'device', 'service', 'ayurveda_medicine', 'lab_test') NOT NULL;

-- 3. Update Wishlist Table
ALTER TABLE wishlist MODIFY COLUMN product_type ENUM('medicine', 'device', 'service', 'ayurveda_medicine', 'lab_test') NOT NULL;

-- 4. Update Deals Table (if applicable)
-- ALTER TABLE deals MODIFY COLUMN product_type ENUM('medicine', 'device', 'ayurveda_medicine') NOT NULL;
