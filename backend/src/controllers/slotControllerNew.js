const db = require('../config/database');

// Get available slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const query = `
            SELECT id, slot_date, start_time, end_time, is_booked
            FROM appointment_slots
            WHERE doctor_id = ? AND slot_date = ? AND is_booked = FALSE
            ORDER BY start_time ASC
        `;

        const [results] = await db.query(query, [doctorId, date]);
        res.json(results);
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get slots for a date range (for calendar view)
exports.getSlotsByDateRange = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const query = `
            SELECT slot_date, COUNT(*) as total_slots, 
                   SUM(CASE WHEN is_booked = FALSE THEN 1 ELSE 0 END) as available_slots
            FROM appointment_slots
            WHERE doctor_id = ? 
            AND slot_date BETWEEN ? AND ?
            GROUP BY slot_date
            ORDER BY slot_date ASC
        `;

        const [results] = await db.query(query, [doctorId, startDate, endDate]);
        res.json(results);
    } catch (error) {
        console.error('Error in getSlotsByDateRange:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Set doctor availability and generate slots
exports.setAvailability = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get doctor ID from userId
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const doctorId = doctors[0].id;

        const { availability, generateDays = 30 } = req.body;

        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({ message: 'Invalid availability data' });
        }

        // Delete old availability
        const deleteOldAvailability = 'DELETE FROM doctor_availability WHERE doctor_id = ?';
        await db.query(deleteOldAvailability, [doctorId]);

        // Insert new availability
        const availabilityInserts = availability
            .filter(slot => slot.isActive)
            .map(slot => [
                doctorId,
                slot.dayOfWeek,
                slot.startTime,
                slot.endTime,
                slot.slotDuration || 30,
                true
            ]);

        if (availabilityInserts.length === 0) {
            return res.json({ message: 'No availability set', slotsCreated: 0 });
        }

        const insertAvailability = `
            INSERT INTO doctor_availability 
            (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
            VALUES ?
        `;

        await db.query(insertAvailability, [availabilityInserts]);

        // Generate slots for the next X days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + generateDays);

        await generateSlotsForDoctor(doctorId, startDate, endDate, availability, res);

    } catch (error) {
        console.error('Error in setAvailability:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to generate slots
async function generateSlotsForDoctor(doctorId, startDate, endDate, availability, res) {
    try {
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Fetch date-specific exceptions for this doctor
        const exceptionsQuery = `
            SELECT exception_date, is_available, start_time, end_time, slot_duration
            FROM doctor_date_exceptions
            WHERE doctor_id = ? AND exception_date BETWEEN ? AND ?
        `;
        const [exceptions] = await db.query(exceptionsQuery, [
            doctorId,
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
        ]);

        // Create a map of exception dates for quick lookup
        const exceptionMap = new Map();
        exceptions.forEach(ex => {
            const dateStr = new Date(ex.exception_date).toISOString().split('T')[0];
            exceptionMap.set(dateStr, ex);
        });

        // Loop through each date
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];

            // Check if there's a date-specific exception
            const exception = exceptionMap.get(dateStr);

            if (exception) {
                // If exception exists and is not available, skip this date entirely
                if (!exception.is_available) {
                    continue;
                }

                // Use exception's custom hours
                const slotDuration = exception.slot_duration || 30;
                const [startHour, startMin] = exception.start_time.split(':').map(Number);
                const [endHour, endMin] = exception.end_time.split(':').map(Number);

                const slotStart = new Date(date);
                slotStart.setHours(startHour, startMin, 0, 0);

                const slotEnd = new Date(date);
                slotEnd.setHours(endHour, endMin, 0, 0);

                // Generate slots for this exception date
                let current = new Date(slotStart);
                while (current < slotEnd) {
                    const next = new Date(current);
                    next.setMinutes(next.getMinutes() + slotDuration);

                    if (next <= slotEnd) {
                        const startTimeStr = current.toTimeString().split(' ')[0].substring(0, 5) + ':00';
                        const endTimeStr = next.toTimeString().split(' ')[0].substring(0, 5) + ':00';
                        slots.push([doctorId, dateStr, startTimeStr, endTimeStr, false]);
                    }

                    current = next;
                }
            } else {
                // No exception, use weekly schedule
                const dayOfWeek = date.getDay();

                // Find availability for this day
                const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isActive);

                if (dayAvailability) {
                    const slotDuration = dayAvailability.slotDuration || 30;
                    const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
                    const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);

                    const slotStart = new Date(date);
                    slotStart.setHours(startHour, startMin, 0, 0);

                    const slotEnd = new Date(date);
                    slotEnd.setHours(endHour, endMin, 0, 0);

                    // Generate slots for this day
                    let current = new Date(slotStart);
                    while (current < slotEnd) {
                        const next = new Date(current);
                        next.setMinutes(next.getMinutes() + slotDuration);

                        if (next <= slotEnd) {
                            const startTimeStr = current.toTimeString().split(' ')[0].substring(0, 5) + ':00';
                            const endTimeStr = next.toTimeString().split(' ')[0].substring(0, 5) + ':00';
                            slots.push([doctorId, dateStr, startTimeStr, endTimeStr, false]);
                        }

                        current = next;
                    }
                }
            }
        }

        if (slots.length > 0) {
            // Check for existing slots to avoid duplicates
            const insertSlots = `
                INSERT INTO appointment_slots (doctor_id, slot_date, start_time, end_time, is_booked)
                VALUES ?
                ON DUPLICATE KEY UPDATE is_booked = is_booked
            `;

            const [result] = await db.query(insertSlots, [slots]);

            res.json({
                message: 'Availability set and slots generated successfully',
                slotsCreated: result.affectedRows
            });
        } else {
            res.json({ message: 'Availability set but no slots generated', slotsCreated: 0 });
        }
    } catch (error) {
        console.error('Error generating slots:', error);
        res.status(500).json({ message: 'Error generating slots' });
    }
}

// Get doctor's availability configuration
exports.getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const query = `
            SELECT id, day_of_week, start_time, end_time, slot_duration, is_active
            FROM doctor_availability
            WHERE doctor_id = ? AND is_active = TRUE
            ORDER BY day_of_week ASC
        `;

        const [results] = await db.query(query, [doctorId]);
        res.json(results);
    } catch (error) {
        console.error('Error in getDoctorAvailability:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Set date-specific exceptions
exports.setDateExceptions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get doctor ID from userId
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const doctorId = doctors[0].id;

        const { exceptions } = req.body;

        if (!exceptions || !Array.isArray(exceptions)) {
            return res.status(400).json({ message: 'Invalid exceptions data' });
        }

        // Insert or update exceptions
        const results = [];
        for (const exception of exceptions) {
            const { date, isAvailable, startTime, endTime, slotDuration } = exception;

            const insertQuery = `
                INSERT INTO doctor_date_exceptions 
                (doctor_id, exception_date, is_available, start_time, end_time, slot_duration)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                is_available = VALUES(is_available),
                start_time = VALUES(start_time),
                end_time = VALUES(end_time),
                slot_duration = VALUES(slot_duration)
            `;

            const [result] = await db.query(insertQuery, [
                doctorId,
                date,
                isAvailable || false,
                startTime || null,
                endTime || null,
                slotDuration || 30
            ]);

            results.push(result);
        }

        res.json({ message: 'Date exceptions saved successfully', count: results.length });
    } catch (error) {
        console.error('Error in setDateExceptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get date-specific exceptions for the logged-in doctor
exports.getMyDateExceptions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get doctor ID from userId
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const doctorId = doctors[0].id;

        const query = `
            SELECT id, exception_date, is_available, start_time, end_time, slot_duration
            FROM doctor_date_exceptions
            WHERE doctor_id = ?
            ORDER BY exception_date ASC
        `;

        const [results] = await db.query(query, [doctorId]);
        res.json(results);
    } catch (error) {
        console.error('Error in getMyDateExceptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get date-specific exceptions for a doctor (public endpoint for patients)
exports.getDateExceptions = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const query = `
            SELECT id, exception_date, is_available, start_time, end_time, slot_duration
            FROM doctor_date_exceptions
            WHERE doctor_id = ?
            ORDER BY exception_date ASC
        `;

        const [results] = await db.query(query, [doctorId]);
        res.json(results);
    } catch (error) {
        console.error('Error in getDateExceptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a specific date exception
exports.deleteDateException = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.params;

        // Get doctor ID from userId
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const doctorId = doctors[0].id;

        const deleteQuery = 'DELETE FROM doctor_date_exceptions WHERE doctor_id = ? AND exception_date = ?';
        const [result] = await db.query(deleteQuery, [doctorId, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Date exception not found' });
        }

        res.json({ message: 'Date exception deleted successfully' });
    } catch (error) {
        console.error('Error in deleteDateException:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
