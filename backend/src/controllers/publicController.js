const pool = require('../config/database');

exports.getPublicStats = async (req, res) => {
    try {
        const [[{ doctorCount }]] = await pool.query('SELECT COUNT(*) as doctorCount FROM doctors');
        const [[{ patientCount }]] = await pool.query('SELECT COUNT(*) as patientCount FROM users WHERE role = "user"');
        const [[{ appointmentCount }]] = await pool.query('SELECT COUNT(*) as appointmentCount FROM appointments WHERE status = "completed"');
        const [[{ hospitalCount }]] = await pool.query('SELECT COUNT(*) as hospitalCount FROM hospitals');
        const [[{ pharmacyCount }]] = await pool.query('SELECT COUNT(*) as pharmacyCount FROM pharmacies');

        res.json({
            success: true,
            stats: {
                doctors: doctorCount || 0,
                patients: patientCount || 0,
                appointments: appointmentCount || 0,
                hospitals: hospitalCount || 0,
                pharmacies: pharmacyCount || 0,
                satisfaction: 98 // Hardcoded for now, could be calculated later
            }
        });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
