-- Add long_definition to the search index for better matching of modern disease terms
ALTER TABLE ayurveda_morbidity_codes DROP INDEX idx_search;
ALTER TABLE ayurveda_morbidity_codes ADD FULLTEXT INDEX idx_search (namc_term, namc_term_devanagari, short_definition, long_definition);
