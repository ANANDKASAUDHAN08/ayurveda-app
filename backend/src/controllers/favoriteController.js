const db = require('../config/database');

exports.toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, itemType } = req.body;

        if (!itemId || !itemType) {
            return res.status(400).json({ message: 'Item ID and Type are required' });
        }

        // Check if already favorited
        const [existing] = await db.execute(
            'SELECT id FROM favorites WHERE userId = ? AND itemId = ? AND itemType = ?',
            [userId, itemId, itemType]
        );

        if (existing.length > 0) {
            // Remove from favorites
            await db.execute(
                'DELETE FROM favorites WHERE userId = ? AND itemId = ? AND itemType = ?',
                [userId, itemId, itemType]
            );
            return res.json({ message: 'Removed from favorites', isFavorite: false });
        } else {
            // Add to favorites
            await db.execute(
                'INSERT INTO favorites (userId, itemId, itemType) VALUES (?, ?, ?)',
                [userId, itemId, itemType]
            );
            return res.json({ message: 'Added to favorites', isFavorite: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const [favorites] = await db.execute(
            'SELECT itemId, itemType FROM favorites WHERE userId = ?',
            [userId]
        );
        res.json({ favorites });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.isFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, itemType } = req.params;

        const [existing] = await db.execute(
            'SELECT id FROM favorites WHERE userId = ? AND itemId = ? AND itemType = ?',
            [userId, itemId, itemType]
        );

        res.json({ isFavorite: existing.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
