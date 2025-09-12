-- Storage Migration: Clean up document paths and organize by employee_id
-- This migration updates document paths from temp structure to clean employee_id structure

-- Create a function to migrate document paths
CREATE OR REPLACE FUNCTION migrate_document_paths()
RETURNS TABLE (
  employee_id text,
  full_name text,
  old_path text,
  new_path text,
  migration_status text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  emp_record record;
  doc_record jsonb;
  updated_docs jsonb := '[]'::jsonb;
  old_path_str text;
  new_path_str text;
  clean_filename text;
  file_extension text;
  document_type text;
BEGIN
  -- Loop through all employees with documents containing temp paths
  FOR emp_record IN 
    SELECT 
      ed.employee_id,
      ed.full_name,
      ed.application_id,
      ed.documents
    FROM employees_details ed
    WHERE 
      ed.documents IS NOT NULL 
      AND ed.employee_id IS NOT NULL
      AND ed.documents::text LIKE '%onboarding/temp/%'
  LOOP
    -- Reset for each employee
    updated_docs := '[]'::jsonb;
    
    -- Loop through each document for this employee
    FOR doc_record IN 
      SELECT value FROM jsonb_array_elements(emp_record.documents)
    LOOP
      old_path_str := doc_record->>'path';
      
      -- Check if this is a temp path that needs migration
      IF old_path_str LIKE '%onboarding/temp/%' THEN
        -- Extract document type and create clean filename
        document_type := COALESCE(doc_record->>'type', 'document');
        
        -- Get file extension from filename or path
        IF doc_record->>'filename' IS NOT NULL THEN
          file_extension := split_part(doc_record->>'filename', '.', -1);
        ELSE
          file_extension := split_part(old_path_str, '.', -1);
        END IF;
        
        -- Create clean filename: document_type.extension (e.g., aadhaar_front.jpg)
        clean_filename := lower(regexp_replace(document_type, '[^a-z0-9]', '_', 'g')) || '.' || file_extension;
        
        -- Create new path: onboarding/[employee_id]/[clean_filename]
        new_path_str := 'onboarding/' || emp_record.employee_id || '/' || clean_filename;
        
        -- Return migration info for logging
        employee_id := emp_record.employee_id;
        full_name := emp_record.full_name;
        old_path := old_path_str;
        new_path := new_path_str;
        migration_status := 'NEEDS_MIGRATION';
        RETURN NEXT;
        
        -- Update the document with new path (but keep other fields)
        updated_docs := updated_docs || jsonb_build_object(
          'type', doc_record->>'type',
          'filename', clean_filename,
          'path', new_path_str,
          'size', COALESCE((doc_record->>'size')::bigint, 0),
          'mime_type', doc_record->>'mime_type',
          'uploaded_at', COALESCE(doc_record->>'uploaded_at', now()::text)
        );
      ELSE
        -- Keep non-temp documents as-is
        updated_docs := updated_docs || doc_record;
      END IF;
    END LOOP;
    
    -- Update the employee's documents with new paths
    UPDATE employees_details 
    SET 
      documents = updated_docs,
      updated_at = now()
    WHERE application_id = emp_record.application_id;
    
  END LOOP;
  
  RETURN;
END;
$$;

-- Create a view to show migration status
CREATE OR REPLACE VIEW storage_migration_status AS
SELECT 
  ed.employee_id,
  ed.full_name,
  ed.status,
  CASE 
    WHEN ed.documents IS NULL THEN 0
    ELSE jsonb_array_length(ed.documents)
  END as total_documents,
  CASE 
    WHEN ed.documents IS NULL THEN 0
    ELSE (
      SELECT COUNT(*)
      FROM jsonb_array_elements(ed.documents) doc
      WHERE doc->>'path' LIKE '%onboarding/temp/%'
    )
  END as temp_documents,
  CASE 
    WHEN ed.documents IS NULL THEN 0
    ELSE (
      SELECT COUNT(*)
      FROM jsonb_array_elements(ed.documents) doc
      WHERE doc->>'path' LIKE 'onboarding/' || ed.employee_id || '/%'
    )
  END as clean_documents
FROM employees_details ed
WHERE ed.employee_id IS NOT NULL
ORDER BY temp_documents DESC, ed.employee_id;

-- Show current migration status
SELECT 
  'BEFORE MIGRATION' as status,
  COUNT(*) as employees_with_documents,
  SUM(temp_documents) as total_temp_documents,
  SUM(clean_documents) as total_clean_documents
FROM storage_migration_status
WHERE total_documents > 0;

-- Uncomment the line below to run the migration
-- SELECT * FROM migrate_document_paths();

-- After running migration, check status again
-- SELECT 
--   'AFTER MIGRATION' as status,
--   COUNT(*) as employees_with_documents,
--   SUM(temp_documents) as total_temp_documents,
--   SUM(clean_documents) as total_clean_documents
-- FROM storage_migration_status
-- WHERE total_documents > 0;