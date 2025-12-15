const db = require('../config/database');

exports.bookAppointment = async (req, res) => {
    try {
        const { slotId, type, otp } = req.body;
        const userId = req.user.id;

        if (otp !== '1234') {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Find slot
        const [slots] = await db.execute('SELECT * FROM slots WHERE id = ?', [slotId]);
        if (slots.length === 0) return res.status(404).json({ message: 'Slot not found' });

        const slot = slots[0];

        if (slot.isBooked) return res.status(400).json({ message: 'Slot already booked' });

        // Verify lock
        const now = new Date();
        if (slot.lockedBy !== userId || (slot.lockedUntil && new Date(slot.lockedUntil) < now)) {
            if (slot.lockedUntil && new Date(slot.lockedUntil) > now && slot.lockedBy !== userId) {
                return res.status(400).json({ message: 'Slot lock expired or invalid' });
            }
        }

        // Create Appointment
        const [apptResult] = await db.execute(
            'INSERT INTO appointments (userId, doctorId, slotId, patientName, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, slot.doctorId, slotId, req.user.name || 'Patient', slot.startTime, new Date(slot.startTime).toLocaleTimeString(), 'booked']
        );
        const appointmentId = apptResult.insertId;

        // Update Slot
        await db.execute(
            'UPDATE slots SET isBooked = TRUE, lockedUntil = NULL, lockedBy = NULL WHERE id = ?',
            [slotId]
        );

        res.json({
            message: 'Appointment booked successfully',
            appointment: { id: appointmentId, userId, doctorId: slot.doctorId, slotId, status: 'booked' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT a.*, 
                   d.name as doctorName, d.specialization, d.image as doctorImage,
                   s.startTime, s.endTime
            FROM appointments a
            JOIN doctors d ON a.doctorId = d.id
            JOIN slots s ON a.slotId = s.id
            WHERE a.userId = ?
            ORDER BY a.createdAt DESC
        `;

        const [rows] = await db.execute(query, [userId]);

        // Format response to match previous structure if needed, or return flat
        // The frontend likely expects nested objects based on previous Sequelize 'include'
        const appointments = rows.map(row => ({
            id: row.id,
            userId: row.userId,
            doctorId: row.doctorId,
            slotId: row.slotId,
            status: row.status,
            date: row.date,
            time: row.time,
            createdAt: row.createdAt,
            Doctor: {
                name: row.doctorName,
                specialization: row.specialization,
                image: row.doctorImage
            },
            Slot: {
                startTime: row.startTime,
                endTime: row.endTime
            }
        }));

        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [appointments] = await db.execute(
            'SELECT * FROM appointments WHERE id = ? AND userId = ?',
            [id, userId]
        );

        if (appointments.length === 0) return res.status(404).json({ message: 'Appointment not found' });

        const appointment = appointments[0];

        // Check time constraint
        const [slots] = await db.execute('SELECT * FROM slots WHERE id = ?', [appointment.slotId]);
        const slot = slots[0];

        const now = new Date();
        const slotTime = new Date(slot.startTime);
        const hoursDiff = (slotTime - now) / 36e5;

        if (hoursDiff < 24) {
            return res.status(400).json({ message: 'Cannot cancel within 24 hours' });
        }

        // Update Appointment
        await db.execute('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', id]);

        // Free Slot
        await db.execute('UPDATE slots SET isBooked = FALSE WHERE id = ?', [appointment.slotId]);

        res.json({ message: 'Appointment cancelled' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
