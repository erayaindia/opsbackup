-- Add Employee ID System
-- Run this SQL script to add automatic employee ID generation

-- =============================================================================
-- 1. ADD EMPLOYEE_ID FIELDS TO EXISTING TABLES
-- =============================================================================

-- Add employee_id to employees_details table
ALTER TABLE employees_details 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(10) UNIQUE;

-- Add employee_id to app_users table (for approved employees)
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(10) UNIQUE;

-- =============================================================================
-- 2. CREATE SEQUENCE FOR EMPLOYEE ID GENERATION
-- =============================================================================

-- Create sequence for employee ID numbering (starts at 1)
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

-- =============================================================================
-- 3. CREATE FUNCTION TO GENERATE NEXT EMPLOYEE ID
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    max_existing_id INTEGER;
    next_id INTEGER;
    employee_id VARCHAR(10);
    max_attempts INTEGER := 100;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Find the highest existing employee ID number
        SELECT COALESCE(
            MAX(
                CASE 
                    WHEN employee_id ~ '^ER[0-9]+$' 
                    THEN SUBSTRING(employee_id FROM 3)::INTEGER 
                    ELSE 0 
                END
            ), 
            0
        ) INTO max_existing_id
        FROM (
            SELECT employee_id FROM app_users WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
            UNION ALL
            SELECT employee_id FROM employees_details WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
        ) AS all_ids;
        
        -- Next ID is the max existing + 1
        next_id := max_existing_id + 1;
        employee_id := 'ER' || LPAD(next_id::TEXT, 2, '0');
        
        -- Double-check this ID doesn't exist (race condition protection)
        IF NOT EXISTS (SELECT 1 FROM app_users WHERE employee_id = employee_id) 
           AND NOT EXISTS (SELECT 1 FROM employees_details WHERE employee_id = employee_id) THEN
            EXIT; -- We found a unique ID
        END IF;
        
        -- Prevent infinite loop
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique employee ID after % attempts', max_attempts;
        END IF;
        
        -- Small delay to handle high concurrency
        PERFORM pg_sleep(0.01);
    END LOOP;
    
    RETURN employee_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. CREATE FUNCTION TO ASSIGN EMPLOYEE ID ON APPROVAL
-- =============================================================================

CREATE OR REPLACE FUNCTION assign_employee_id_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    new_employee_id VARCHAR(10);
BEGIN
    -- Only generate employee ID when status changes to 'approved' and employee_id is null
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.employee_id IS NULL THEN
        -- Generate new employee ID
        new_employee_id := generate_employee_id();
        NEW.employee_id := new_employee_id;
        
        -- Log the employee ID assignment
        INSERT INTO employee_onboarding_logs (employee_detail_id, action, performed_by, details)
        VALUES (NEW.id, 'employee_id_assigned', NEW.approved_by, 
                jsonb_build_object('employee_id', new_employee_id));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. CREATE TRIGGER TO AUTO-ASSIGN EMPLOYEE ID
-- =============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_assign_employee_id ON employees_details;

-- Create trigger that fires before update on employees_details
CREATE TRIGGER auto_assign_employee_id
    BEFORE UPDATE ON employees_details
    FOR EACH ROW
    EXECUTE FUNCTION assign_employee_id_on_approval();

-- =============================================================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- =============================================================================

-- Index on employee_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_employees_details_employee_id ON employees_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_app_users_employee_id ON app_users(employee_id);

-- =============================================================================
-- 7. UPDATE EXISTING APPROVED APPLICATIONS (OPTIONAL)
-- =============================================================================

-- If you have existing approved applications without employee IDs, uncomment this:
/*
UPDATE employees_details 
SET employee_id = generate_employee_id() 
WHERE status = 'approved' AND employee_id IS NULL;
*/

-- =============================================================================
-- 8. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get next employee ID without consuming it (for preview)
CREATE OR REPLACE FUNCTION preview_next_employee_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    max_existing_id INTEGER;
    next_id INTEGER;
BEGIN
    -- Find the highest existing employee ID number
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN employee_id ~ '^ER[0-9]+$' 
                THEN SUBSTRING(employee_id FROM 3)::INTEGER 
                ELSE 0 
            END
        ), 
        0
    ) INTO max_existing_id
    FROM (
        SELECT employee_id FROM app_users WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
        UNION ALL
        SELECT employee_id FROM employees_details WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
    ) AS all_ids;
    
    -- Next ID is the max existing + 1
    next_id := max_existing_id + 1;
    
    RETURN 'ER' || LPAD(next_id::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to reset sequence (admin only, use carefully!)
CREATE OR REPLACE FUNCTION reset_employee_id_sequence(start_from INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    -- Reset the sequence to start from specified number
    PERFORM setval('employee_id_seq', start_from, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. TEST THE SYSTEM
-- =============================================================================

-- Test: Check what the next employee ID would be
SELECT preview_next_employee_id() as next_employee_id;

-- Test: Check existing employee IDs
SELECT 
    COUNT(*) as total_employees_with_id,
    MIN(employee_id) as first_employee_id,
    MAX(employee_id) as last_employee_id
FROM (
    SELECT employee_id FROM app_users WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
    UNION ALL
    SELECT employee_id FROM employees_details WHERE employee_id IS NOT NULL AND employee_id LIKE 'ER%'
) AS all_employee_ids;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Employee ID System setup completed!';
    RAISE NOTICE '🆔 Format: ER01, ER02, ER03, etc.';
    RAISE NOTICE '⚡ Auto-assigned when application is approved';
    RAISE NOTICE '🔄 Next ID: %', preview_next_employee_id();
    RAISE NOTICE '📊 Sequence starts from: 1';
END $$;