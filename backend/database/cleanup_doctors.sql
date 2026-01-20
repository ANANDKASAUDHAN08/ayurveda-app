-- Clean up existing doctors data
-- Keeps only first 2-3 doctors and deletes the rest
-- Run this BEFORE running the seed_doctors.js script

-- IMPORTANT: This will delete doctor records!
-- Make sure to backup your data first if needed

-- Step 1: Check how many doctors you have
SELECT COUNT(*) as total_doctors FROM doctors;

-- Step 2: See the first 3 doctors (these will be kept)
SELECT id, name, specialization, location FROM doctors ORDER BY id LIMIT 3;

-- Step 3: Delete all doctors except the first 2
-- (Change LIMIT 2 to LIMIT 3 if you want to keep 3 doctors)
DELETE FROM doctors 
WHERE id NOT IN (
    SELECT * FROM (
        SELECT id FROM doctors ORDER BY id LIMIT 2
    ) as temp
);

-- Step 4: Also clean up orphaned availability slots
DELETE FROM doctor_availability 
WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Step 5: Also clean up orphaned appointments (optional - be careful!)
-- Uncomment the following lines if you want to delete appointments too
-- DELETE FROM appointments 
-- WHERE doctor_id NOT IN (SELECT id FROM doctors);

-- Step 6: Verify cleanup
SELECT COUNT(*) as remaining_doctors FROM doctors;
SELECT id, name, specialization FROM doctors;

-- Success message
SELECT 'Cleanup completed! You can now run: node scripts/seed_doctors.js' as Status;
