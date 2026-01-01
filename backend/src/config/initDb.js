const db = require('./database');

async function initDb() {
    try {

        // Users Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Doctors Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS doctors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(255),
                experience INT DEFAULT 0,
                mode VARCHAR(50) DEFAULT 'both',
                location VARCHAR(255),
                about TEXT,
                qualifications TEXT,
                consultationFee INT DEFAULT 500,
                languages VARCHAR(255) DEFAULT 'English, Hindi',
                phone VARCHAR(20),
                image VARCHAR(255),
                isVerified BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Slots Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctorId INT NOT NULL,
                startTime DATETIME NOT NULL,
                endTime DATETIME NOT NULL,
                isBooked BOOLEAN DEFAULT FALSE,
                lockedBy INT,
                lockedUntil DATETIME,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE
            )
        `);

        // Appointments Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                doctorId INT NOT NULL,
                slotId INT NOT NULL,
                patientName VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'confirmed',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
                FOREIGN KEY (slotId) REFERENCES slots(id) ON DELETE CASCADE
            )
        `);

        // Favorites Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                itemId VARCHAR(255) NOT NULL,
                itemType ENUM('article', 'doctor', 'hospital', 'pharmacy') NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (userId, itemId, itemType),
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initDb();
