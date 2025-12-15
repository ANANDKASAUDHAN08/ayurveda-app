const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const email = 'testdoc@example.com';
        const newPassword = 'password123';

        console.log(`🔄 Resetting password for ${email}...`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await db.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Password updated successfully');
        } else {
            console.log('❌ User not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetPassword();
