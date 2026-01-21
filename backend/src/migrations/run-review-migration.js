/**
 * Database Migration Script for Review System
 * Run this script to create the hospital_reviews and website_reviews tables
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
    try {
        console.log('🔄 Starting review system database migration...\n');

        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '../database/review_schema.sql');
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');

        // Split SQL file by statements (simple split by semicolon)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

            try {
                await db.execute(statement);
                console.log(`✅ Statement ${i + 1} executed successfully\n`);
            } catch (error) {
                // If table already exists, that's okay
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`ℹ️  Table already exists, skipping...\n`);
                } else {
                    throw error;
                }
            }
        }

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');

        const [hospitalReviewsTable] = await db.execute("SHOW TABLES LIKE 'hospital_reviews'");
        const [websiteReviewsTable] = await db.execute("SHOW TABLES LIKE 'website_reviews'");

        if (hospitalReviewsTable.length > 0) {
            console.log('✅ hospital_reviews table verified');
            const [columns] = await db.execute("DESCRIBE hospital_reviews");
            console.log(`   - ${columns.length} columns created`);
        } else {
            console.log('❌ hospital_reviews table NOT found');
        }

        if (websiteReviewsTable.length > 0) {
            console.log('✅ website_reviews table verified');
            const [columns] = await db.execute("DESCRIBE website_reviews");
            console.log(`   - ${columns.length} columns created`);
        } else {
            console.log('❌ website_reviews table NOT found');
        }

        console.log('\n✨ Migration completed successfully!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nError details:', error.message);
        process.exit(1);
    }
}

// Run the migration
runMigration();
