-- Migration: Add Enhanced Fields to Static Pages
-- Run this to add sections, effective_date, version, and other fields

-- Add sections column (JSON)
ALTER TABLE static_pages ADD COLUMN sections JSON AFTER content;

-- Add effective_date column
ALTER TABLE static_pages ADD COLUMN effective_date DATE AFTER meta_description;

-- Add version column
ALTER TABLE static_pages ADD COLUMN version VARCHAR(50) AFTER effective_date;

-- Add is_published column
ALTER TABLE static_pages ADD COLUMN is_published BOOLEAN DEFAULT TRUE AFTER version;

-- Add created_at column
ALTER TABLE static_pages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER is_published;

-- Update existing records to be published
UPDATE static_pages SET is_published = TRUE WHERE is_published IS NULL;
