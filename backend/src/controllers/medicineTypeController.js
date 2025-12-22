const db = require('../config/database');

/**
 * Get all medicine types
 * GET /api/medicine-types
 */
exports.getAllMedicineTypes = async (req, res) => {
    try {
        const [medicineTypes] = await db.execute(
            'SELECT * FROM medicine_types WHERE is_active = TRUE ORDER BY id ASC'
        );

        res.json({
            success: true,
            data: medicineTypes
        });
    } catch (error) {
        console.error('Error fetching medicine types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine types'
        });
    }
};

/**
 * Get single medicine type by ID
 * GET /api/medicine-types/:id
 */
exports.getMedicineTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [medicineTypes] = await db.execute(
            'SELECT * FROM medicine_types WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (medicineTypes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Medicine type not found'
            });
        }

        res.json({
            success: true,
            data: medicineTypes[0]
        });
    } catch (error) {
        console.error('Error fetching medicine type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine type'
        });
    }
};

/**
 * Get doctors by medicine type
 * GET /api/medicine-types/:id/doctors
 */
exports.getDoctorsByMedicineType = async (req, res) => {
    try {
        const { id } = req.params;
        const { city, specialization, available } = req.query;

        let query = `
            SELECT 
                d.*,
                mt.name as medicine_type_name,
                mt.color as medicine_type_color
            FROM doctors d
            LEFT JOIN medicine_types mt ON d.medicine_type_id = mt.id
            WHERE d.medicine_type_id = ?
        `;

        const params = [id];

        // Add optional filters
        if (city) {
            query += ' AND d.city = ?';
            params.push(city);
        }

        if (specialization) {
            query += ' AND d.specialization LIKE ?';
            params.push(`%${specialization}%`);
        }

        if (available === 'true') {
            query += ' AND d.available = TRUE';
        }

        query += ' ORDER BY d.rating DESC, d.experience DESC';

        const [doctors] = await db.execute(query, params);

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors by medicine type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

/**
 * Get statistics for medicine types
 * GET /api/medicine-types/stats
 */
exports.getMedicineTypeStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                mt.id,
                mt.name,
                mt.color,
                mt.icon,
                COUNT(DISTINCT d.id) as doctor_count,
                COUNT(DISTINCT a.id) as consultation_count,
                COALESCE(AVG(d.rating), 0) as avg_rating
            FROM medicine_types mt
            LEFT JOIN doctors d ON mt.id = d.medicine_type_id
            LEFT JOIN appointments a ON mt.id = a.medicine_type_id
            WHERE mt.is_active = TRUE
            GROUP BY mt.id, mt.name, mt.color, mt.icon
            ORDER BY mt.id ASC
        `);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching medicine type stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

module.exports = exports;
