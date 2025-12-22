-- Add Paracetamol medicine to prescription #6
-- This will allow the medicine to appear in the order modal

INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
VALUES (6, 'Paracetamol', '500mg', 'Three times daily', '5 days', 15, 'Take after meals');

-- Verify the insertion
SELECT * FROM prescription_medicines WHERE prescription_id = 6;
