require('dotenv').config({ path: '../../.env' });
const db = require('../config/database');

async function migrate() {
    try {
        console.log('🚀 Starting Phase 3: Billing & Invoicing Migration...');

        // 1. Standardize Subscriptions Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                tier ENUM('premium', 'premium_plus') NOT NULL,
                status ENUM('active', 'cancelled', 'expired', 'trial', 'pending') DEFAULT 'pending',
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                billing_cycle ENUM('monthly', 'yearly') NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                auto_renew BOOLEAN DEFAULT TRUE,
                razorpay_subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Subscriptions table verified/created');

        // 2. Standardize Payments Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                subscription_id INT,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                payment_method VARCHAR(50),
                payment_gateway ENUM('stripe', 'razorpay', 'paypal') DEFAULT 'razorpay',
                transaction_id VARCHAR(255) UNIQUE,
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                payment_type ENUM('subscription', 'consultation', 'one_time') DEFAULT 'subscription',
                metadata JSON,
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Payments table verified/created');

        // 3. Create Invoices Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                payment_id INT NOT NULL,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                status ENUM('paid', 'unpaid', 'void') DEFAULT 'paid',
                billing_details JSON,
                pdf_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Invoices table created');

        // 4. Update Users Table with missing fields
        const [columns] = await db.execute("SHOW COLUMNS FROM users");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('billing_details')) {
            await db.execute('ALTER TABLE users ADD COLUMN billing_details JSON NULL');
            console.log('✅ Added billing_details to users table');
        }

        console.log('🏁 Phase 3 Migration Completed Successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Phase 3 Migration Failed:', e);
        process.exit(1);
    }
}

migrate();
