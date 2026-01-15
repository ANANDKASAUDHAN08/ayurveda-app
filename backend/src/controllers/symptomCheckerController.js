const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/database');

// Load and parse CSV data
const loadCSV = (filename) => {
    return new Promise((resolve, reject) => {
        const results = [];
        let subdirectory = 'common';
        if (filename.includes('Allopathy')) {
            subdirectory = 'allopathy';
        }
        const filePath = path.join(__dirname, '../../data', subdirectory, filename);

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

// Symptom Checker Controller
class SymptomCheckerController {
    constructor() {
        this.checkSymptoms = this.checkSymptoms.bind(this);
        this.getTreatment = this.getTreatment.bind(this);
        this.getDiagnosisAndTreatment = this.getDiagnosisAndTreatment.bind(this);
        this.getAvailableSymptoms = this.getAvailableSymptoms.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.getHistoryDetail = this.getHistoryDetail.bind(this);
        this.saveHistory = this.saveHistory.bind(this);
    }

    // Check symptoms and predict disease
    async checkSymptoms(req, res) {
        try {
            const { symptoms } = req.body; // Expected: array of symptom names

            if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
                return res.status(400).json({ error: 'Please provide symptoms array' });
            }

            // Load diagnosis data
            const diagnosisData = await loadCSV('data.csv');

            // Convert symptom names to lowercase for matching
            const symptomSet = new Set(symptoms.map(s => s.toLowerCase().replace(/ /g, '_')));

            // Find matching diseases
            const matches = diagnosisData.filter(row => {
                let matchCount = 0;
                let totalSymptoms = 0;

                Object.keys(row).forEach(key => {
                    if (key !== 'prognosis' && row[key] === '1') {
                        totalSymptoms++;
                        if (symptomSet.has(key.toLowerCase())) {
                            matchCount++;
                        }
                    }
                });

                // Return if at least 50% symptoms match
                return matchCount > 0 && (matchCount / Math.max(totalSymptoms, symptoms.length)) >= 0.3;
            });

            if (matches.length === 0) {
                return res.json({
                    success: true,
                    message: 'No matching diseases found',
                    possibleDiseases: [],
                    recommendation: 'Please consult a healthcare professional for accurate diagnosis'
                });
            }

            // Count disease occurrences
            const diseaseCount = {};
            matches.forEach(match => {
                const disease = match.prognosis;
                diseaseCount[disease] = (diseaseCount[disease] || 0) + 1;
            });

            // Sort by frequency
            const sortedDiseases = Object.entries(diseaseCount)
                .sort((a, b) => b[1] - a[1])
                .map(([disease, count]) => ({
                    disease,
                    confidence: Math.min((count / matches.length) * 100, 95).toFixed(1)
                }));

            // Enhance with NAMC details for the top prediction
            const topDisease = sortedDiseases[0].disease;
            let namcInsight = null;

            try {
                // Try to find a match by term or in definitions
                // We split by ( to handle names like "Diabetes (Type 2)" -> "Diabetes"
                const searchStr = topDisease.split('(')[0].trim();
                const [namcResults] = await db.query(`
                    SELECT * FROM ayurveda_morbidity_codes
                    WHERE namc_term LIKE ?
                    OR short_definition LIKE ?
                    OR long_definition LIKE ?
                    OR MATCH(namc_term, namc_term_devanagari, short_definition, long_definition) AGAINST(?)
                    LIMIT 1
                `, [`%${searchStr}%`, `%${searchStr}%`, `%${searchStr}%`, searchStr]);

                if (namcResults.length > 0) {
                    namcInsight = {
                        term: namcResults[0].namc_term,
                        devanagari: namcResults[0].namc_term_devanagari,
                        definition: namcResults[0].short_definition,
                        clinical_insight: namcResults[0].long_definition,
                        namc_id: namcResults[0].namc_id
                    };
                }
            } catch (err) {
                console.error('Error fetching NAMC insight:', err);
            }

            // Save to history if userId is available
            if (req.user && req.user.id) {
                await this.saveHistory(req.user.id, symptoms, topDisease, confidence, namcInsight?.namc_id);
            }

            return res.json({
                success: true,
                symptomsProvided: symptoms,
                possibleDiseases: sortedDiseases,
                totalMatches: matches.length,
                ayurvedicInsight: namcInsight
            });

        } catch (error) {
            console.error('Symptom check error:', error);
            return res.status(500).json({ error: 'Error processing symptoms', details: error.message });
        }
    }

    // Get treatment recommendation (HYBRID: Ayurveda + Allopathy)
    async getTreatment(req, res) {
        try {
            const { disease, age, gender, severity, treatmentType = 'both' } = req.body;

            if (!disease) {
                return res.status(400).json({ error: 'Disease is required' });
            }

            // Validate treatmentType
            const validTypes = ['ayurveda', 'allopathy', 'both'];
            const type = treatmentType.toLowerCase();
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    error: 'Invalid treatmentType. Use: ayurveda, allopathy, or both'
                });
            }

            const treatments = {
                ayurveda: [],
                allopathy: []
            };

            // Load datasets based on treatment type
            if (type === 'ayurveda' || type === 'both') {
                const ayurvedaData = await loadCSV('Drug prescription Dataset.csv');
                treatments.ayurveda = this.filterTreatments(ayurvedaData, disease, age, gender, severity);
            }

            if (type === 'allopathy' || type === 'both') {
                const allopathyData = await loadCSV('Allopathy prescription Dataset.csv');
                treatments.allopathy = this.filterTreatments(allopathyData, disease, age, gender, severity);
            }

            // Prepare response based on type
            if (type === 'both') {
                return res.json({
                    success: true,
                    disease,
                    treatmentType: 'both',
                    ayurveda: {
                        recommendations: treatments.ayurveda.slice(0, 5),
                        note: 'Please consult an Ayurvedic practitioner before taking any medication'
                    },
                    allopathy: {
                        recommendations: treatments.allopathy.slice(0, 5),
                        note: 'Please consult a licensed physician before taking any medication'
                    }
                });
            } else {
                const selectedTreatments = treatments[type];
                return res.json({
                    success: true,
                    disease,
                    treatmentType: type,
                    recommendations: selectedTreatments.slice(0, 5),
                    note: type === 'ayurveda'
                        ? 'Please consult an Ayurvedic practitioner before taking any medication'
                        : 'Please consult a licensed physician before taking any medication'
                });
            }

        } catch (error) {
            console.error('Treatment recommendation error:', error);
            return res.status(500).json({ error: 'Error fetching treatment', details: error.message });
        }
    }

    // Helper method to filter treatments
    filterTreatments(data, disease, age, gender, severity) {
        // Filter based on disease
        let filtered = data.filter(row =>
            row.disease.toLowerCase() === disease.toLowerCase()
        );

        if (filtered.length === 0) {
            return [];
        }

        // Further filter by age, gender, severity if provided
        if (age) {
            const ageFiltered = filtered.filter(row => Math.abs(parseInt(row.age) - parseInt(age)) <= 5);
            if (ageFiltered.length > 0) filtered = ageFiltered;
        }

        if (gender) {
            const genderFiltered = filtered.filter(row => row.gender.toLowerCase() === gender.toLowerCase());
            if (genderFiltered.length > 0) filtered = genderFiltered;
        }

        if (severity) {
            const severityFiltered = filtered.filter(row => row.severity.toUpperCase() === severity.toUpperCase());
            if (severityFiltered.length > 0) filtered = severityFiltered;
        }

        // Get unique drugs with their details
        return [...new Set(filtered.map(row => row.drug))].map(drug => {
            const drugRow = filtered.find(row => row.drug === drug);
            return {
                drug,
                severity: drugRow.severity,
                ageGroup: drugRow.age,
                gender: drugRow.gender
            };
        });
    }

    // Get complete diagnosis and treatment (HYBRID: combined)
    async getDiagnosisAndTreatment(req, res) {
        try {
            const { symptoms, age, gender, treatmentType = 'both' } = req.body;

            if (!symptoms || !Array.isArray(symptoms)) {
                return res.status(400).json({ error: 'Symptoms array is required' });
            }

            // Validate treatmentType
            const validTypes = ['ayurveda', 'allopathy', 'both'];
            const type = treatmentType.toLowerCase();
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    error: 'Invalid treatmentType. Use: ayurveda, allopathy, or both'
                });
            }

            // Load diagnosis data
            const diagnosisData = await loadCSV('data.csv');

            // Check symptoms (similar logic as checkSymptoms)
            const symptomSet = new Set(symptoms.map(s => s.toLowerCase().replace(/ /g, '_')));

            const matches = diagnosisData.filter(row => {
                let matchCount = 0;
                Object.keys(row).forEach(key => {
                    if (key !== 'prognosis' && row[key] === '1' && symptomSet.has(key.toLowerCase())) {
                        matchCount++;
                    }
                });
                return matchCount >= Math.min(symptoms.length * 0.3, 2);
            });

            if (matches.length === 0) {
                return res.json({
                    success: true,
                    diagnosis: null,
                    treatments: {},
                    message: 'No matching diseases found based on symptoms'
                });
            }

            // Get most likely disease
            const diseaseCount = {};
            matches.forEach(match => {
                const disease = match.prognosis;
                diseaseCount[disease] = (diseaseCount[disease] || 0) + 1;
            });

            const mostLikelyDisease = Object.entries(diseaseCount)
                .sort((a, b) => b[1] - a[1])[0][0];

            // Load treatment datasets based on type
            const treatmentsByType = {};

            if (type === 'ayurveda' || type === 'both') {
                const ayurvedaData = await loadCSV('Drug prescription Dataset.csv');
                treatmentsByType.ayurveda = this.organizeTreatmentsBySeverity(
                    ayurvedaData, mostLikelyDisease, age, gender
                );
            }

            if (type === 'allopathy' || type === 'both') {
                const allopathyData = await loadCSV('Allopathy prescription Dataset.csv');
                treatmentsByType.allopathy = this.organizeTreatmentsBySeverity(
                    allopathyData, mostLikelyDisease, age, gender
                );
            }

            // Fetch Ayurvedic Insight from NAMC
            let namcInsight = null;
            try {
                const searchStr = mostLikelyDisease.split('(')[0].trim();
                const [namcResults] = await db.query(`
                    SELECT * FROM ayurveda_morbidity_codes
                    WHERE namc_term LIKE ?
                    OR short_definition LIKE ?
                    OR long_definition LIKE ?
                    OR MATCH(namc_term, namc_term_devanagari, short_definition, long_definition) AGAINST(?)
                    LIMIT 1
                `, [`%${searchStr}%`, `%${searchStr}%`, `%${searchStr}%`, searchStr]);

                if (namcResults.length > 0) {
                    namcInsight = {
                        term: namcResults[0].namc_term,
                        devanagari: namcResults[0].namc_term_devanagari,
                        definition: namcResults[0].short_definition,
                        clinical_insight: namcResults[0].long_definition,
                        namc_id: namcResults[0].id
                    };
                }
            } catch (error) {
                console.error('Failed to fetch NAMC insight in getDiagnosisAndTreatment:', error);
            }

            // Prepare response based on treatment type
            const response = {
                success: true,
                diagnosis: {
                    disease: mostLikelyDisease,
                    confidence: Math.min((diseaseCount[mostLikelyDisease] / matches.length) * 100, 95).toFixed(1) + '%',
                    symptomsMatched: symptoms.length
                },
                ayurvedicInsight: namcInsight // Moved outside diagnosis object
            };

            // Save to history
            if (req.user && req.user.id) {
                // Determine treatments to save based on type
                let treatmentsToSave = {};
                if (type === 'both') {
                    treatmentsToSave = {
                        ayurveda: treatmentsByType.ayurveda,
                        allopathy: treatmentsByType.allopathy
                    };
                } else {
                    treatmentsToSave = treatmentsByType[type];
                }

                await this.saveHistory(
                    req.user.id,
                    symptoms,
                    mostLikelyDisease,
                    response.diagnosis.confidence.replace('%', ''),
                    namcInsight?.namc_id,
                    treatmentsToSave,
                    type,
                    age,
                    gender
                );
            }

            if (type === 'both') {
                response.treatments = {
                    ayurveda: treatmentsByType.ayurveda,
                    allopathy: treatmentsByType.allopathy
                };
                response.disclaimer = 'This is an AI-based suggestion. Please consult a qualified healthcare practitioner for proper diagnosis and treatment.';
            } else {
                response.treatments = treatmentsByType[type];
                response.treatmentType = type;
                response.disclaimer = type === 'ayurveda'
                    ? 'This is an AI-based suggestion. Please consult a qualified Ayurvedic practitioner for proper diagnosis and treatment.'
                    : 'This is an AI-based suggestion. Please consult a licensed physician for proper diagnosis and treatment.';
            }

            return res.json(response);

        } catch (error) {
            console.error('Diagnosis and treatment error:', error);
            return res.status(500).json({ error: 'Error processing request', details: error.message });
        }
    }

    // Helper method to organize treatments by severity
    organizeTreatmentsBySeverity(data, disease, age, gender) {
        let treatments = data.filter(row =>
            row.disease.toLowerCase() === disease.toLowerCase()
        );

        // Filter by age and gender if provided
        if (age) {
            const ageFiltered = treatments.filter(row => Math.abs(parseInt(row.age) - parseInt(age)) <= 5);
            if (ageFiltered.length > 0) treatments = ageFiltered;
        }

        if (gender) {
            const genderFiltered = treatments.filter(row => row.gender.toLowerCase() === gender.toLowerCase());
            if (genderFiltered.length > 0) treatments = genderFiltered;
        }

        // Group by severity
        const treatmentBySeverity = {
            LOW: [],
            NORMAL: [],
            HIGH: []
        };

        treatments.forEach(row => {
            if (!treatmentBySeverity[row.severity].includes(row.drug)) {
                treatmentBySeverity[row.severity].push(row.drug);
            }
        });

        return treatmentBySeverity;
    }

    // Get all available symptoms
    async getAvailableSymptoms(req, res) {
        try {
            const diagnosisData = await loadCSV('data.csv');

            if (diagnosisData.length === 0) {
                return res.json({ success: true, symptoms: [] });
            }

            // Get all column names except 'prognosis'
            const symptoms = Object.keys(diagnosisData[0])
                .filter(key => key !== 'prognosis')
                .map(symptom => ({
                    name: symptom.replace(/_/g, ' '),
                    value: symptom
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return res.json({
                success: true,
                totalSymptoms: symptoms.length,
                symptoms
            });

        } catch (error) {
            console.error('Get symptoms error:', error);
            return res.status(500).json({ error: 'Error fetching symptoms', details: error.message });
        }
    }

    // Save check results to history
    async saveHistory(userId, symptoms, diagnosis, confidence, namcId, treatments = null, treatmentType = 'both', age = null, gender = null) {
        try {
            await db.execute(
                `INSERT INTO symptom_history 
                (user_id, symptoms, top_diagnosis, confidence, namc_id, treatments, treatment_type, age, gender)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    JSON.stringify(symptoms),
                    diagnosis,
                    confidence,
                    namcId || null,
                    treatments ? JSON.stringify(treatments) : null,
                    treatmentType,
                    age,
                    gender
                ]
            );
        } catch (error) {
            console.error('Error saving symptom history:', error);
            // Don't fail the request if history save fails
        }
    }

    /**
     * Get user's symptom check history
     */
    async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const [history] = await db.execute(
                `SELECT h.*, n.namc_term, n.namc_term_devanagari 
                 FROM symptom_history h
                 LEFT JOIN ayurveda_morbidity_codes n ON h.namc_id = n.id
                 WHERE h.user_id = ? 
                 ORDER BY h.created_at DESC`,
                [userId]
            );

            res.json({
                success: true,
                history: history.map(h => {
                    let symptoms;
                    try {
                        symptoms = (typeof h.symptoms === 'string' && (h.symptoms.trim().startsWith('[') || h.symptoms.trim().startsWith('{')))
                            ? JSON.parse(h.symptoms)
                            : h.symptoms;
                    } catch (e) {
                        symptoms = h.symptoms;
                    }

                    // Fallback for non-array symptoms (e.g. comma-separated string)
                    if (typeof symptoms === 'string') {
                        symptoms = symptoms.includes(',') ? symptoms.split(',').map(s => s.trim()) : [symptoms];
                    } else if (!Array.isArray(symptoms)) {
                        symptoms = [symptoms];
                    }

                    return {
                        id: h.id,
                        symptoms: symptoms,
                        diagnosis: h.top_diagnosis,
                        confidence: h.confidence,
                        date: h.created_at,
                        ayurvedicTerm: h.namc_term,
                        ayurvedicDevanagari: h.namc_term_devanagari
                    };
                })
            });
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({ error: 'Failed to fetch symptom history' });
        }
    }

    /**
     * Get details for a specific history item
     */
    async getHistoryDetail(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const [items] = await db.execute(
                `SELECT h.*, n.namc_term, n.namc_term_devanagari, n.short_definition, n.long_definition
                 FROM symptom_history h
                 LEFT JOIN ayurveda_morbidity_codes n ON h.namc_id = n.id
                 WHERE h.id = ? AND h.user_id = ?`,
                [id, userId]
            );

            if (items.length === 0) {
                return res.status(404).json({ error: 'History item not found' });
            }

            const item = items[0];
            let symptoms;
            try {
                // Try parsing if it looks like JSON
                symptoms = (typeof item.symptoms === 'string' && (item.symptoms.trim().startsWith('[') || item.symptoms.trim().startsWith('{')))
                    ? JSON.parse(item.symptoms)
                    : item.symptoms;
            } catch (e) {
                symptoms = item.symptoms;
            }

            // Fallback for non-array symptoms
            if (typeof symptoms === 'string') {
                symptoms = symptoms.includes(',') ? symptoms.split(',').map(s => s.trim()) : [symptoms];
            } else if (!Array.isArray(symptoms)) {
                symptoms = [symptoms];
            }

            // Fetch treatments for this diagnosis
            // (Re-using logic from getDiagnosisAndTreatment but simplified)
            const ayurvedaData = await loadCSV('Drug prescription Dataset.csv');
            const allopathyData = await loadCSV('Allopathy prescription Dataset.csv');

            const ayurvedaTreatments = this.organizeTreatmentsBySeverity(ayurvedaData, item.top_diagnosis);
            const allopathyTreatments = this.organizeTreatmentsBySeverity(allopathyData, item.top_diagnosis);

            res.json({
                success: true,
                id: item.id,
                date: item.created_at,
                symptoms,
                diagnosis: {
                    disease: item.top_diagnosis,
                    confidence: item.confidence + '%'
                },
                ayurvedicInsight: item.namc_id ? {
                    term: item.namc_term,
                    devanagari: item.namc_term_devanagari,
                    definition: item.short_definition,
                    clinical_insight: item.long_definition
                } : null,
                treatments: {
                    ayurveda: ayurvedaTreatments,
                    allopathy: allopathyTreatments
                }
            });

        } catch (error) {
            console.error('Get history detail error:', error);
            res.status(500).json({ error: 'Failed to fetch history details' });
        }
    }
}

module.exports = new SymptomCheckerController();
