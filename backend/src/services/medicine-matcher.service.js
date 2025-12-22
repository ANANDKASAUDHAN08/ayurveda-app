/**
 * Medicine Matcher Service
 * Matches prescription medicine names with available products
 */

class MedicineMatcherService {
    /**
     * Calculate similarity between two strings using Levenshtein distance
     */
    static calculateSimilarity(str1, str2) {
        str1 = str1.toLowerCase().trim();
        str2 = str2.toLowerCase().trim();

        if (str1 === str2) return 1.0;

        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        const distance = matrix[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Find best matching product for a medicine name
     */
    static findBestMatch(medicineName, products) {
        if (!products || products.length === 0) {
            return null;
        }

        // Try exact match first
        const exactMatch = products.find(p =>
            p.name.toLowerCase().trim() === medicineName.toLowerCase().trim()
        );

        if (exactMatch) {
            return {
                product: exactMatch,
                similarity: 1.0,
                matchType: 'exact'
            };
        }

        // Calculate similarity for all products
        const matches = products.map(product => ({
            product,
            similarity: this.calculateSimilarity(medicineName, product.name)
        }));

        // Sort by similarity
        matches.sort((a, b) => b.similarity - a.similarity);

        // Return best match if similarity > 0.7
        if (matches[0].similarity >= 0.7) {
            return {
                product: matches[0].product,
                similarity: matches[0].similarity,
                matchType: matches[0].similarity >= 0.9 ? 'high' : 'good'
            };
        }

        return null;
    }

    /**
     * Get suggestions for unmatched medicines
     */
    static getSuggestions(medicineName, products, minSimilarity = 0.5) {
        if (!products || products.length === 0) {
            return [];
        }

        const suggestions = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            similarity: this.calculateSimilarity(medicineName, product.name)
        }));

        return suggestions
            .filter(s => s.similarity >= minSimilarity)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5); // Top 5 suggestions
    }

    /**
     * Calculate quantity needed based on prescription duration
     */
    static calculateQuantityNeeded(frequency, duration) {
        // Parse frequency (e.g., "3 times daily", "twice daily", "once daily")
        const frequencyMap = {
            'once': 1,
            'twice': 2,
            'thrice': 3,
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 4
        };

        let timesPerDay = 1;
        const freqLower = frequency.toLowerCase();

        for (const [key, value] of Object.entries(frequencyMap)) {
            if (freqLower.includes(key)) {
                timesPerDay = value;
                break;
            }
        }

        // Parse duration (e.g., "5 days", "2 weeks", "1 month")
        let days = 0;
        const durationLower = duration.toLowerCase();

        if (durationLower.includes('week')) {
            const weeks = parseInt(duration) || 1;
            days = weeks * 7;
        } else if (durationLower.includes('month')) {
            const months = parseInt(duration) || 1;
            days = months * 30;
        } else {
            days = parseInt(duration) || 5;
        }

        return Math.ceil(timesPerDay * days);
    }
}

module.exports = MedicineMatcherService;
