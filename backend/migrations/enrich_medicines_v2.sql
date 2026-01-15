-- Enrich medicines table with rich metadata
ALTER TABLE medicines 
ADD COLUMN drug_interactions TEXT AFTER category,
ADD COLUMN substitutes TEXT AFTER drug_interactions,
ADD COLUMN side_effects_list TEXT AFTER substitutes,
ADD COLUMN review_percent JSON AFTER side_effects_list;

-- Ensure description and other common fields are robust
ALTER TABLE medicines 
MODIFY COLUMN description TEXT,
MODIFY COLUMN composition TEXT;
