const db = require('../config/database');

exports.getSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        let query = 'SELECT * FROM slots WHERE doctorId = ? AND isBooked = FALSE';
        const params = [doctorId];

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query += ' AND startTime BETWEEN ? AND ?';
            params.push(startOfDay, endOfDay);
        }

        // Filter out locked slots that haven't expired
        // (lockedUntil IS NULL OR lockedUntil < NOW)
        query += ' AND (lockedUntil IS NULL OR lockedUntil < NOW())';

        const [slots] = await db.execute(query, params);
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.lockSlot = async (req, res) => {
    try {
        const { slotId } = req.body;
        const userId = req.user.id;

        // Find slot
        const [slots] = await db.execute('SELECT * FROM slots WHERE id = ?', [slotId]);
        if (slots.length === 0) return res.status(404).json({ message: 'Slot not found' });

        const slot = slots[0];

        if (slot.isBooked) return res.status(400).json({ message: 'Slot already booked' });

        const now = new Date();
        if (slot.lockedUntil && new Date(slot.lockedUntil) > now && slot.lockedBy !== userId) {
            return res.status(400).json({ message: 'Slot is currently locked by another user' });
        }

        // Lock for 5 minutes
        const lockedUntil = new Date(Date.now() + 5 * 60000);

        await db.execute(
            'UPDATE slots SET lockedUntil = ?, lockedBy = ? WHERE id = ?',
            [lockedUntil, userId, slotId]
        );

        // Return updated slot
        const [updatedSlots] = await db.execute('SELECT * FROM slots WHERE id = ?', [slotId]);

        res.json({ message: 'Slot locked', slot: updatedSlots[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
