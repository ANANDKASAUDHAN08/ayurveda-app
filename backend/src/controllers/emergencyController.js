const db = require('../config/database');
const NotificationController = require('./notification.controller');

// Get all emergency contacts for a user
exports.getEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user.id;

        const [contacts] = await db.execute(
            `SELECT * FROM emergency_contacts 
       WHERE user_id = ? 
       ORDER BY priority_order ASC, created_at DESC`,
            [userId]
        );

        res.json(contacts);
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({ error: 'Failed to fetch emergency contacts' });
    }
};

// Add new emergency contact
exports.addEmergencyContact = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, relationship, phone_number, is_primary } = req.body;

        // Validation
        if (!name || !phone_number) {
            return res.status(400).json({ error: 'Name and phone number are required' });
        }

        // Get next priority order
        const [maxPriority] = await db.execute(
            'SELECT COALESCE(MAX(priority_order), -1) + 1 as next_priority FROM emergency_contacts WHERE user_id = ?',
            [userId]
        );
        const priority_order = maxPriority[0].next_priority;

        const [result] = await db.execute(
            `INSERT INTO emergency_contacts (user_id, name, relationship, phone_number, is_primary, priority_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name, relationship || null, phone_number, is_primary || false, priority_order]
        );

        res.status(201).json({
            message: 'Emergency contact added successfully',
            contact: {
                id: result.insertId,
                user_id: userId,
                name,
                relationship,
                phone_number,
                is_primary: is_primary || false,
                priority_order
            }
        });

        // Send notification for emergency contact update
        try {
            await NotificationController.createNotification({
                user_id: userId,
                type: 'emergency_contact_updated',
                category: 'emergency',
                title: 'Emergency Contact Added',
                message: `${name} has been added to your emergency contacts.`,
                priority: 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create emergency contact notification:', notifError.message);
        }
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        res.status(500).json({ error: 'Failed to add emergency contact' });
    }
};

// Update emergency contact
exports.updateEmergencyContact = async (req, res) => {
    try {
        const userId = req.user.id;
        const contactId = req.params.id;
        const { name, relationship, phone_number, is_primary } = req.body;

        const [result] = await db.execute(
            `UPDATE emergency_contacts 
       SET name = ?, relationship = ?, phone_number = ?, is_primary = ?
       WHERE id = ? AND user_id = ?`,
            [name, relationship, phone_number, is_primary, contactId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Emergency contact not found' });
        }

        res.json({ message: 'Emergency contact updated successfully' });
    } catch (error) {
        console.error('Error updating emergency contact:', error);
        res.status(500).json({ error: 'Failed to update emergency contact' });
    }
};

// Delete emergency contact
exports.deleteEmergencyContact = async (req, res) => {
    try {
        const userId = req.user.id;
        const contactId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?',
            [contactId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Emergency contact not found' });
        }

        res.json({ message: 'Emergency contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        res.status(500).json({ error: 'Failed to delete emergency contact' });
    }
};

// Reorder emergency contacts (batch update priority_order)
exports.reorderEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contacts } = req.body;

        if (!Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts must be an array' });
        }

        // Update priority_order for each contact
        for (const contact of contacts) {
            await db.execute(
                'UPDATE emergency_contacts SET priority_order = ? WHERE id = ? AND user_id = ?',
                [contact.priority_order, contact.id, userId]
            );
        }

        res.json({ message: 'Contacts reordered successfully' });
    } catch (error) {
        console.error('Error reordering emergency contacts:', error);
        res.status(500).json({ error: 'Failed to reorder emergency contacts' });
    }
};

// Get user's medical information
exports.getMedicalInfo = async (req, res) => {
    try {
        const userId = req.user.id;

        const [medicalInfo] = await db.execute(
            'SELECT * FROM medical_information WHERE user_id = ?',
            [userId]
        );

        if (medicalInfo.length === 0) {
            // Return empty structure if no medical info exists
            return res.json({
                blood_type: null,
                allergies: [],
                medical_conditions: [],
                current_medications: [],
                emergency_instructions: null,
                primary_doctor_name: null,
                primary_doctor_phone: null,
                insurance_provider: null,
                insurance_policy_number: null
            });
        }

        const info = medicalInfo[0];
        res.json({
            blood_type: info.blood_type,
            allergies: info.allergies || [],
            medical_conditions: info.medical_conditions || [],
            current_medications: info.current_medications || [],
            emergency_instructions: info.emergency_instructions,
            primary_doctor_name: info.primary_doctor_name,
            primary_doctor_phone: info.primary_doctor_phone,
            insurance_provider: info.insurance_provider,
            insurance_policy_number: info.insurance_policy_number
        });
    } catch (error) {
        console.error('Error fetching medical information:', error);
        res.status(500).json({ error: 'Failed to fetch medical information' });
    }
};

// Update user's medical information
exports.updateMedicalInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            blood_type,
            allergies,
            medical_conditions,
            current_medications,
            emergency_instructions,
            primary_doctor_name,
            primary_doctor_phone,
            insurance_provider,
            insurance_policy_number
        } = req.body;

        // Check if medical info exists
        const [existing] = await db.execute(
            'SELECT id FROM medical_information WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Insert new medical information
            await db.execute(
                `INSERT INTO medical_information 
         (user_id, blood_type, allergies, medical_conditions, current_medications, 
          emergency_instructions, primary_doctor_name, primary_doctor_phone, 
          insurance_provider, insurance_policy_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    blood_type || null,
                    JSON.stringify(allergies || []),
                    JSON.stringify(medical_conditions || []),
                    JSON.stringify(current_medications || []),
                    emergency_instructions || null,
                    primary_doctor_name || null,
                    primary_doctor_phone || null,
                    insurance_provider || null,
                    insurance_policy_number || null
                ]
            );
        } else {
            // Update existing medical information
            await db.execute(
                `UPDATE medical_information 
         SET blood_type = ?, allergies = ?, medical_conditions = ?, 
             current_medications = ?, emergency_instructions = ?,
             primary_doctor_name = ?, primary_doctor_phone = ?,
             insurance_provider = ?, insurance_policy_number = ?
         WHERE user_id = ?`,
                [
                    blood_type || null,
                    JSON.stringify(allergies || []),
                    JSON.stringify(medical_conditions || []),
                    JSON.stringify(current_medications || []),
                    emergency_instructions || null,
                    primary_doctor_name || null,
                    primary_doctor_phone || null,
                    insurance_provider || null,
                    insurance_policy_number || null,
                    userId
                ]
            );
        }

        res.json({ message: 'Medical information updated successfully' });
    } catch (error) {
        console.error('Error updating medical information:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Failed to update medical information', details: error.message });
    }
};

// Delete user's medical information
exports.deleteMedicalInfo = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            'DELETE FROM medical_information WHERE user_id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medical information not found' });
        }

        res.json({ message: 'Medical information deleted successfully' });
    } catch (error) {
        console.error('Error deleting medical information:', error);
        res.status(500).json({ error: 'Failed to delete medical information' });
    }
};

// Log emergency call (optional - for analytics)
exports.logEmergencyCall = async (req, res) => {
    try {
        const userId = req.user.id;
        const { call_type, called_number, location_lat, location_lng } = req.body;

        await db.execute(
            `INSERT INTO emergency_calls_log (user_id, call_type, called_number, location_lat, location_lng)
       VALUES (?, ?, ?, ?, ?)`,
            [userId, call_type, called_number, location_lat || null, location_lng || null]
        );

        // Send SOS alert notification
        try {
            await NotificationController.createNotification({
                user_id: userId,
                type: 'sos_alert_sent',
                category: 'emergency',
                title: 'SOS Alert Sent',
                message: `Emergency ${call_type} call logged. Stay safe! Help has been notified.`,
                priority: 'urgent'
            });
        } catch (notifError) {
            console.error('Failed to create SOS notification:', notifError.message);
        }

        res.json({ message: 'Emergency call logged successfully' });
    } catch (error) {
        console.error('Error logging emergency call:', error);
        res.status(500).json({ error: 'Failed to log emergency call' });
    }
};

// Get user's emergency call history
exports.getEmergencyCallHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        // Parse and validate limit and offset as integers (prevents SQL injection)
        const validLimit = Math.max(1, Math.min(parseInt(limit) || 50, 100)); // Max 100
        const validOffset = Math.max(0, parseInt(offset) || 0);

        // MySQL doesn't support placeholders for LIMIT/OFFSET, so we use template literals
        // But we ensure the values are validated integers above
        const [calls] = await db.execute(
            `SELECT id, call_type, called_number, location_lat, location_lng, timestamp
             FROM emergency_calls_log 
             WHERE user_id = ? 
             ORDER BY timestamp DESC 
             LIMIT ${validLimit} OFFSET ${validOffset}`,
            [userId]
        );

        // Get total count for pagination
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM emergency_calls_log WHERE user_id = ?',
            [userId]
        );

        res.json({
            calls,
            total: countResult[0].total
        });
    } catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({ error: 'Failed to fetch call history' });
    }
};
