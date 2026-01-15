const db = require('../config/database');

/**
 * Morbidity Controller
 * Handles National Ayurveda Morbidity Codes (NAMC) lookups and search
 */
class MorbidityController {
    constructor() {
        this.searchCodes = this.searchCodes.bind(this);
        this.getCodeById = this.getCodeById.bind(this);
        this.getAllCodes = this.getAllCodes.bind(this);
    }

    /**
     * Search NAMC codes by term, definition or Devanagari
     */
    async searchCodes(req, res) {
        try {
            const { q, limit = 20 } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            // Using Query instead of Execute for better compatibility with LIMIT and MATCH
            const [results] = await db.query(`
                SELECT *, 
                MATCH(namc_term, namc_term_devanagari, short_definition, long_definition) AGAINST(?) as relevance
                FROM ayurveda_morbidity_codes
                WHERE MATCH(namc_term, namc_term_devanagari, short_definition, long_definition) AGAINST(?)
                OR namc_term LIKE ?
                OR namc_term_devanagari LIKE ?
                OR short_definition LIKE ?
                OR long_definition LIKE ?
                ORDER BY relevance DESC
                LIMIT ${parseInt(limit)}
            `, [q, q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

            res.json({
                success: true,
                count: results.length,
                results
            });

        } catch (error) {
            console.error('Search NAMC error:', error);
            res.status(500).json({ error: 'Failed to search morbidity codes' });
        }
    }

    /**
     * Get a specific code by its NAMC ID or internal ID
     */
    async getCodeById(req, res) {
        try {
            const { id } = req.params;

            const [results] = await db.execute(
                'SELECT * FROM ayurveda_morbidity_codes WHERE id = ? OR namc_id = ?',
                [id, id]
            );

            if (results.length === 0) {
                return res.status(404).json({ error: 'Morbidity code not found' });
            }

            res.json({
                success: true,
                data: results[0]
            });

        } catch (error) {
            console.error('Get NAMC by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch morbidity code' });
        }
    }

    /**
     * Get all codes (paginated)
     */
    async getAllCodes(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const cleanLimit = parseInt(limit);
            const cleanOffset = parseInt(offset);

            const [results] = await db.query(
                `SELECT * FROM ayurveda_morbidity_codes ORDER BY namc_id ASC LIMIT ${cleanLimit} OFFSET ${cleanOffset}`
            );

            const [countResults] = await db.query('SELECT COUNT(*) as count FROM ayurveda_morbidity_codes');
            const count = countResults[0].count;

            res.json({
                success: true,
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                data: results
            });

        } catch (error) {
            console.error('Get all NAMC error:', error);
            res.status(500).json({ error: 'Failed to fetch morbidity codes' });
        }
    }
}

module.exports = new MorbidityController();
