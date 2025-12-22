-- Add prescription reference to orders table (only if columns don't exist)
-- Check and add prescription_id
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'healthconnect_db' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'prescription_id');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE orders ADD COLUMN prescription_id BIGINT UNSIGNED NULL', 
  'SELECT "prescription_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add discount_code
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'healthconnect_db' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'discount_code');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE orders ADD COLUMN discount_code VARCHAR(50) NULL', 
  'SELECT "discount_code already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (only if it doesn't exist)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'healthconnect_db' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'prescription_id'
  AND REFERENCED_TABLE_NAME = 'prescriptions');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL', 
  'SELECT "Foreign key already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create prescription discounts table
CREATE TABLE IF NOT EXISTS prescription_discounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default prescription discount
INSERT INTO prescription_discounts (code, discount_type, discount_value, min_order_amount, max_discount)
VALUES ('PRESCRIPTION10', 'percentage', 10.00, 0, 500.00)
ON DUPLICATE KEY UPDATE discount_value = 10.00;
