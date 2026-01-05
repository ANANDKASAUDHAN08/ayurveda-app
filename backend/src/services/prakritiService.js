const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class PrakritiService {
    constructor() {
        this.data = [];
        this.questions = null;
        this.csvPath = path.join(__dirname, '../../data/Updated_Prakriti_With_Features.csv');
        this.loadData();
    }

    async loadData() {
        return new Promise((resolve, reject) => {
            if (this.data.length > 0) return resolve(this.data);

            const results = [];
            fs.createReadStream(this.csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    this.data = results;
                    this.extractQuestions();
                    resolve(this.data);
                })
                .on('error', (err) => reject(err));
        });
    }

    extractQuestions() {
        if (!this.data.length) return;

        const keys = Object.keys(this.data[0]).filter(k => k !== 'Dosha');
        const questionsMap = {};

        keys.forEach(key => {
            const uniqueOptions = [...new Set(this.data.map(row => row[key]))].filter(Boolean);
            questionsMap[key] = {
                id: key,
                label: key.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to CamelCase or just use as is
                options: uniqueOptions
            };
        });

        this.questions = questionsMap;
    }

    async getQuizStructure() {
        if (!this.questions) await this.loadData();

        // Group questions into logical sections for the UI
        const sections = [
            {
                title: 'Physical Build',
                description: 'Tell us about your basic body structure and frame.',
                questions: ['Body Size', 'Body Weight', 'Height', 'Bone Structure', 'Shape of face', 'Cheeks', 'Nose', 'Lips', 'Teeth and gums', 'Nails'].map(id => this.questions[id])
            },
            {
                title: 'Skin & Hair',
                description: 'Details about your complexion and hair texture.',
                questions: ['Complexion', 'General feel of skin', 'Texture of Skin', 'Skin Sensitivity', 'Hair Color', 'Appearance of Hair'].map(id => this.questions[id])
            },
            {
                title: 'Eyes & Sight',
                description: 'Reflections of your internal state through your eyes.',
                questions: ['Eyes', 'Eyelashes', 'Blinking of Eyes'].map(id => this.questions[id])
            },
            {
                title: 'Physiology',
                description: 'Your appetite, metabolism, and digestion patterns.',
                questions: ['Appetite', 'Metabolism Type', 'Digestion Quality', 'Liking tastes', 'Water Intake'].map(id => this.questions[id])
            },
            {
                title: 'Lifestyle & Mind',
                description: 'Daily habits, stress levels, and preferences.',
                questions: ['Dietary Habits', 'Physical Activity Level', 'Sleep Patterns', 'Stress Levels', 'Climate Preference'].map(id => this.questions[id])
            }
        ];

        return sections.filter(s => s.questions.every(q => !!q));
    }

    async predictDosha(userAnswers) {
        if (!this.data.length) await this.loadData();

        const scores = {
            'Vata': 0, 'Pitta': 0, 'Kapha': 0,
            'vata+pitta': 0, 'pitta+kapha': 0, 'vata+kapha': 0
        };

        // Matching algorithm
        this.data.forEach(row => {
            let matches = 0;
            Object.keys(userAnswers).forEach(key => {
                if (row[key] === userAnswers[key]) {
                    matches++;
                }
            });

            if (matches > 0) {
                const dosha = row.Dosha.trim();
                if (scores[dosha] !== undefined) {
                    scores[dosha] += matches;
                }
            }
        });

        // Consolidate scores
        const finalScores = {
            'Vata': scores['Vata'] + (scores['vata+pitta'] * 0.5) + (scores['vata+kapha'] * 0.5),
            'Pitta': scores['Pitta'] + (scores['vata+pitta'] * 0.5) + (scores['pitta+kapha'] * 0.5),
            'Kapha': scores['Kapha'] + (scores['pitta+kapha'] * 0.5) + (scores['vata+kapha'] * 0.5)
        };

        const total = finalScores.Vata + finalScores.Pitta + finalScores.Kapha || 1;
        const breakdown = {
            vata: Math.round((finalScores.Vata / total) * 100),
            pitta: Math.round((finalScores.Pitta / total) * 100),
            kapha: Math.round((finalScores.Kapha / total) * 100)
        };

        let dominant = 'Vata';
        if (finalScores.Pitta > finalScores.Vata && finalScores.Pitta > finalScores.Kapha) dominant = 'Pitta';
        if (finalScores.Kapha > finalScores.Vata && finalScores.Kapha > finalScores.Pitta) dominant = 'Kapha';

        return {
            dominant,
            breakdown,
            traits: this.generateDynamicTraits(dominant, userAnswers)
        };
    }

    generateDynamicTraits(dominant, answers) {
        const baseTraits = {
            'Vata': {
                element: 'Air & Ether',
                qualities: 'Dry, Light, Cold, Rough, Subtle, Mobile',
                defaultDesc: 'You have a creative and energetic nature with a quick mind.',
                defaultRecs: 'Focus on warm, grounding foods and maintaining a regular routine.'
            },
            'Pitta': {
                element: 'Fire & Water',
                qualities: 'Sharp, Hot, Liquid, Oily, Spreading',
                defaultDesc: 'You possess a sharp intellect, strong determination, and natural leadership.',
                defaultRecs: 'Prioritize cooling foods, hydration, and moderate exercise.'
            },
            'Kapha': {
                element: 'Earth & Water',
                qualities: 'Heavy, Slow, Cool, Oily, Smooth, Stable',
                defaultDesc: 'You are characterized by a calm, steady nature and strong endurance.',
                defaultRecs: 'Incorporate stimulating activities and light, warm, pungent foods.'
            }
        };

        const base = baseTraits[dominant] || baseTraits['Vata'];

        // Build dynamic description
        let dynamicDesc = base.defaultDesc;
        if (answers['Digestion Quality'] === 'low' || answers['Metabolism Type'] === 'slow') {
            dynamicDesc += ` Your current metabolism suggests a need for stimulating digestive fire (Agni).`;
        }
        if (answers['Stress Levels'] === 'high') {
            dynamicDesc += ` Your high stress levels indicate a temporary imbalance in your ${dominant === 'Vata' ? 'nervous system' : dominant === 'Pitta' ? 'emotional heat' : 'mental clarity'}.`;
        }

        // Build dynamic recommendations
        let recs = `<ul><li><strong>Primary Advice:</strong> ${base.defaultRecs}</li>`;

        if (answers['Sleep Patterns'] === 'short') {
            recs += `<li><strong>Sleep:</strong> Aim for 7-8 hours of rest. ${dominant === 'Vata' ? 'Vata types' : 'Your constitution'} needs deep restoration.</li>`;
        }

        if (answers['Appetite'] && answers['Appetite'].toLowerCase().includes('irregular')) {
            recs += `<li><strong>Diet:</strong> Try to eat at consistent times each day to stabilize your internal clock.</li>`;
        }

        if (answers['Skin Sensitivity'] === 'high') {
            recs += `<li><strong>Skincare:</strong> Use natural, cooling oils. Avoid harsh chemicals that might aggravate your sensitive skin.</li>`;
        }

        // Add Herb suggestions based on dominant dosha
        const herbMap = {
            'Vata': 'Ashwagandha, Ginger, Triphala',
            'Pitta': 'Amalaki (Amla), Brahmi, Shatavari',
            'Kapha': 'TulsI (Holy Basil), Turmeric, Guggulu'
        };
        recs += `<li><strong>Suggested Herbs:</strong> ${herbMap[dominant]}</li>`;
        recs += `</ul>`;

        return {
            element: base.element,
            qualities: base.qualities,
            description: dynamicDesc,
            recommendations: recs,
            integrative: this.generateIntegrativeInsights(dominant, answers)
        };
    }

    generateIntegrativeInsights(dominant, answers) {
        let insights = "<h4><i class='fas fa-microscope'></i> Modern Health Markers</h4><ul>";

        // Metabolic rate link
        const metabolism = answers['Metabolism Type'] || 'moderate';
        insights += `<li><strong>Metabolic Profile:</strong> Your ${metabolism} metabolism indicates a ${metabolism === 'fast' ? 'higher caloric turnover' : metabolism === 'slow' ? 'tendency for slower nutrient absorption' : 'balanced metabolic state'}.</li>`;

        // Stress sensitivity
        const stress = answers['Stress Levels'] || 'moderate';
        if (stress === 'high') {
            insights += `<li><strong>Cortisol Sensitivity:</strong> High stress reactivity suggests monitoring cortisol rhythms. Consider magnesium-rich foods.</li>`;
        }

        // Skin/Inflammation
        if (answers['Skin Sensitivity'] === 'high' || dominant === 'Pitta') {
            insights += `<li><strong>Inflammatory Marker:</strong> Tendency for higher skin/systemic sensitivity. Watch for histamine-rich foods.</li>`;
        }

        insights += "</ul><p class='text-xs mt-2 italic'>Note: These observations bridge Ayurvedic patterns with modern wellness markers and are not clinical diagnoses.</p>";

        return insights;
    }
}

module.exports = new PrakritiService();
