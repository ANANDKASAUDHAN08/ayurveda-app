const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function seedAyurveda() {
    try {
        console.log('🌱 Initializing Ayurveda tables and seeding data...');

        // 1. Create Tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                image_url TEXT,
                category VARCHAR(100),
                benefits TEXT,
                is_bestseller BOOLEAN DEFAULT FALSE,
                stock_status VARCHAR(50) DEFAULT 'In Stock',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_exercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('yoga', 'pranayama', 'meditation') NOT NULL,
                description TEXT,
                duration_minutes INT,
                difficulty ENUM('beginner', 'intermediate', 'advanced'),
                image_url TEXT,
                benefits TEXT,
                steps TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                excerpt TEXT,
                content TEXT,
                image_url TEXT,
                author VARCHAR(255),
                read_time_minutes INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_rituals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                time_of_day ENUM('Morning', 'Afternoon', 'Evening', 'Night') NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                benefits TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute('DROP TABLE IF EXISTS ayurveda_herbs');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_herbs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                scientific_name VARCHAR(255),
                description TEXT,
                preview TEXT,
                benefits TEXT,
                usage_instructions TEXT,
                image_url TEXT,
                link TEXT,
                pacify TEXT,
                aggravate TEXT,
                tridosha BOOLEAN DEFAULT FALSE,
                rasa TEXT,
                guna TEXT,
                virya VARCHAR(100),
                vipaka VARCHAR(100),
                prabhav TEXT,
                is_herb_of_month BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_yoga_poses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sanskrit_name VARCHAR(255),
                description TEXT,
                benefits TEXT,
                alignment_tips TEXT,
                difficulty ENUM('Beginner', 'Intermediate', 'Advanced'),
                image_url TEXT,
                is_pose_of_week BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tables created or already exist.');

        // 2. Clear existing data
        await db.execute('DELETE FROM ayurveda_medicines');
        await db.execute('DELETE FROM ayurveda_exercises');
        await db.execute('DELETE FROM ayurveda_articles');
        await db.execute('DELETE FROM ayurveda_rituals');
        await db.execute('DELETE FROM ayurveda_herbs');
        await db.execute('DELETE FROM ayurveda_yoga_poses');

        // 3. Seed Medicines
        const medicines = [
            ['Ashwagandha Churna', 'Traditional rejuvenation and stress relief tonic.', 249.00, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600', 'Energy', 'Immunity, Stress Relief', true],
            ['Chyawanprash', 'Premium immunity booster with amla and 40+ herbs.', 450.00, 'https://images.unsplash.com/photo-1627731742915-1883541014e8?w=600', 'Immunity', 'Cold prevention, Vitality', true],
            ['Brahmi Vati', 'Natural brain tonic to improve memory and focus.', 320.00, 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=600', 'Mind', 'Concentration, Calmness', false],
            ['Triphala Tablet', 'Gentle digestive support and natural detoxification.', 180.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', 'Digestion', 'Detox, Gut health', true],
            ['Shatavari Tablet', 'Supports female hormonal balance and vitality.', 280.00, 'https://images.unsplash.com/photo-1540348943440-a17017150720?w=600', 'Women\'s Health', 'Hormonal Balance, Vitality', false],
            ['Neem Capsules', 'Natural blood purifier and skin health support.', 210.00, 'https://images.unsplash.com/photo-1563213126-a4284184c98a?w=600', 'Detox', 'Skin Health, Immunity', false]
        ];

        for (const m of medicines) {
            await db.execute(
                'INSERT INTO ayurveda_medicines (name, description, price, image_url, category, benefits, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?)',
                m
            );
        }

        // 4. Seed Exercises
        const exercises = [
            ['Surya Namaskar', 'yoga', 'A complete body workout including 12 powerful asanas.', 15, 'beginner', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', 'Flexibility, Energy', '1. Prayer pose, 2. Raised arms pose...'],
            ['Anulom Vilom', 'pranayama', 'Alternate nostril breathing to balance the nervous system.', 10, 'beginner', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', 'Focus, Calmness', 'Sit comfortably, close right nostril, inhale through left...'],
            ['Vipassana', 'meditation', 'Ancient technique of mindfulness and self-observation.', 20, 'intermediate', 'https://images.unsplash.com/photo-1528319725582-ddc9ad3a393?w=600', 'Mental Clarity, Peace', 'Sit silently, observe breath without judgment...'],
            ['Tadasana', 'yoga', 'Mountain pose for improving posture and balance.', 5, 'beginner', 'https://images.unsplash.com/photo-1599447421416-3414502d18a5?w=600', 'Posture, Concentration', 'Stand tall, feet together, reach arms up...'],
            ['Bhramari Pranayama', 'pranayama', 'Bee breath to instantly calm the mind and reduce anxiety.', 8, 'beginner', 'https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?w=600', 'Stress Relief, Sleep', 'Close ears with thumbs, eyes with fingers, hum while exhaling...']
        ];

        for (const e of exercises) {
            await db.execute(
                'INSERT INTO ayurveda_exercises (name, type, description, duration_minutes, difficulty, image_url, benefits, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                e
            );
        }

        // 5. Seed Articles
        const articles = [
            ['Understanding Your Dosha', 'Ayurveda 101', 'Learn why Vata, Pitta, and Kapha are the keys to your health.', 'In Ayurveda, everything is composed of five elements: Earth, Water, Fire, Air, and Ether. These combine to form the three biological energies known as Doshas...', 'https://images.unsplash.com/photo-1512423175373-ca04d90ca070?w=800', 'Dr. Sneha Sharma', 8],
            ['The Power of Turmeric', 'Wellness', 'Why this golden spice is a staple in every Ayurvedic home.', 'Curcumin, the active compound in turmeric, has been shown to have potent anti-inflammatory effects. Ayurvedic practitioners have used it for centuries to treat joint pain and boost immunity...', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800', 'Amit Kumar', 5],
            ['Daily Rituals for Deep Sleep', 'Lifestyle', 'Simple bedtime habits to transform your rest.', 'Ayurveda suggests that deep sleep is one of the three pillars of health. Practicing Abhyanga (self-massage) and drinking warm spiced milk can prepare your body for natural rest...', 'https://images.unsplash.com/photo-1511295742364-917e70331bc0?w=800', 'Priya Rao', 6],
            ['Gut Health & Ayurveda', 'Nutrition', 'Ancient secrets to a happy stomach and strong Agni.', 'Agni, the digestive fire, is the cornerstone of health in Ayurveda. Learn how to stoke your fire with the right foods and spices...', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 'Dr. Rajesh Varma', 10],
            ['Yoga for Mental Peace', 'Mindfulness', 'How movement synchronizes with the mind for tranquility.', 'Yoga is more than just stretching; it is a moving meditation. Explore specific asanas that help in quieting the mental chatter...', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 'Sunita Yoga', 7]
        ];

        for (const a of articles) {
            await db.execute(
                'INSERT INTO ayurveda_articles (title, category, excerpt, content, image_url, author, read_time_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                a
            );
        }

        // 6. Seed Rituals
        const rituals = [
            ['Brahma Muhurta Wakeup', 'Morning', 'Waking up before sunrise to synchronize with nature.', '🌅', 'Mental Clarity, Peace'],
            ['Tongue Scraping', 'Morning', 'Removing toxins (Ama) from the tongue for oral hygiene.', '👅', 'Detox, Fresh Breath'],
            ['Abhyanga', 'Morning', 'Self-massage with warm oil to nourish the skin and calm the nervous system.', '💆', 'Skin Health, Stress Relief'],
            ['Warm Water Sip', 'Morning', 'Drinking warm water to stimulate digestion.', '💧', 'Digestion, Hydration'],
            ['Post-Lunch Walk', 'Afternoon', 'A short 100-step walk to aid digestion.', '🚶', 'Metabolism, Digestion'],
            ['Sunset Meditation', 'Evening', 'Connecting with the fading light for grounding.', '🧘', 'Grounding, Focus'],
            ['Golden Milk', 'Night', 'Warm turmeric milk for restorative sleep.', '🥛', 'Sleep, Immunity'],
            ['Phone-Free Hour', 'Night', 'Disconnecting from screens before bed.', '📵', 'Deep Sleep, Mental Health']
        ];

        for (const r of rituals) {
            await db.execute(
                'INSERT INTO ayurveda_rituals (title, time_of_day, description, icon, benefits) VALUES (?, ?, ?, ?, ?)',
                r
            );
        }

        // 7. Seed Herbs from herb.json
        const herbDataPath = path.join(__dirname, '../data/herb.json');
        let herbs = [];
        try {
            const rawData = fs.readFileSync(herbDataPath, 'utf8');
            const jsonData = JSON.parse(rawData);
            herbs = jsonData.map(h => [
                h.name,
                h.scientific_name || '',
                h.description || h.preview || '',
                h.preview || '',
                h.benefits || '',
                h.usage_instructions || '',
                h.image_url || 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600',
                h.link || '',
                JSON.stringify(h.pacify || []),
                JSON.stringify(h.aggravate || []),
                h.tridosha ? 1 : 0,
                JSON.stringify(h.rasa || []),
                JSON.stringify(h.guna || []),
                h.virya || '',
                h.vipaka || '',
                JSON.stringify(h.prabhav || []),
                h.is_herb_of_month ? 1 : 0
            ]);
        } catch (err) {
            console.error('Warning: Could not load herb.json, using fallback seed data.', err);
            herbs = [
                ['Ashwagandha', 'Withania somnifera', 'Known as Indian Ginseng, it is a powerful adaptogen.', 'Adaptive herb.', 'Reduces stress', 'Take with milk', 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600', '', '["Vata", "Kapha"]', '["Pitta"]', 0, '["Tikta", "Kashaya"]', '["Guru", "Snigdha"]', 'Ushna', 'Madhura', '["Balya"]', 1]
            ];
        }

        for (const h of herbs) {
            await db.execute(
                'INSERT INTO ayurveda_herbs (name, scientific_name, description, preview, benefits, usage_instructions, image_url, link, pacify, aggravate, tridosha, rasa, guna, virya, vipaka, prabhav, is_herb_of_month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                h
            );
        }

        // 8. Seed Yoga Poses
        const yogaPoses = [
            ['Tree Pose', 'Vrikshasana', 'A grounding pose that improves balance and focus.', 'Strengthens legs, improves poise, calms the mind.', 'Keep your gaze fixed on a point, press foot firmly into thigh.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', 'Beginner', true],
            ['Warrior II', 'Virabhadrasana II', 'A powerful pose that builds strength and stamina.', 'Strengthens legs and arms, opens hips and chest.', 'Keep front knee over ankle, reach actively through fingertips.', 'https://images.unsplash.com/photo-1599447421416-3414502d18a5?w=600', 'Intermediate', false],
            ['Downward Dog', 'Adho Mukha Svanasana', 'An essential inversion that stretches the whole body.', 'Stretches hamstrings and calves, strengthens shoulders.', 'Spread fingers wide, push hips back and up.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', 'Beginner', false],
            ['Child Pose', 'Balasana', 'A resting pose that centers the mind and body.', 'Gently stretches hips and thighs, relieves stress.', 'Rest forehead on the mat, breathe deeply into the back.', 'https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?w=600', 'Beginner', false],
            ['Triangle Pose', 'Trikonasana', 'A foundational pose that extends the body.', 'Stretches legs and spine, improves digestion.', 'Keep both legs straight, reach top hand to sky.', 'https://images.unsplash.com/photo-1528319725582-ddc9ad3a393?w=600', 'Intermediate', false]
        ];

        for (const p of yogaPoses) {
            await db.execute(
                'INSERT INTO ayurveda_yoga_poses (name, sanskrit_name, description, benefits, alignment_tips, image_url, difficulty, is_pose_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                p
            );
        }

        console.log('✅ Ayurveda data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAyurveda();
