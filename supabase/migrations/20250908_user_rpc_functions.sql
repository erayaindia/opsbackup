-- User Management RPC Functions
-- Enhanced functions for user management operations that need to be called from the client

-- =============================================================================
-- USER STATUS MANAGEMENT RPC
-- =============================================================================

-- Admin set user status (enhanced version of the original)
CREATE OR REPLACE FUNCTION admin_set_user_status(
  p_user_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record app.users;
  old_status TEXT;
  result JSONB;
BEGIN
  -- Check if current user has permission to change status
  IF NOT (app.is_super_admin() OR 
          EXISTS (
            SELECT 1 FROM app.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'manager') 
            AND status = 'active'
          )) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions to change user status'
    );
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('active', 'pending', 'suspended', 'on_leave', 'inactive', 'resigned', 'terminated') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status value'
    );
  END IF;
  
  -- Get current user record
  SELECT * INTO user_record FROM app.users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Prevent changing super admin status (unless by super admin)
  IF user_record.role = 'super_admin' AND NOT app.is_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot change super admin status'
    );
  END IF;
  
  -- Store old status for audit
  old_status := user_record.status::TEXT;
  
  -- Update status
  UPDATE app.users 
  SET status = p_status::user_status,
      exited_at = CASE 
        WHEN p_status IN ('resigned', 'terminated') THEN CURRENT_DATE
        ELSE NULL 
      END
  WHERE id = p_user_id;
  
  -- Log the action
  PERFORM app.log_user_action(
    'change_status'::user_action,
    p_user_id,
    jsonb_build_object(
      'old_status', old_status,
      'new_status', p_status,
      'reason', COALESCE(p_reason, 'No reason provided')
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'user_id', p_user_id,
      'old_status', old_status,
      'new_status', p_status,
      'message', format('User status changed from %s to %s', old_status, p_status)
    )
  );
END;
$$;

-- =============================================================================
-- USER CREATION RPC
-- =============================================================================

-- Create user with full validation and audit
CREATE OR REPLACE FUNCTION create_user_with_validation(
  p_user_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  user_record app.users;
  required_fields TEXT[] := ARRAY['full_name', 'company_email', 'role', 'department'];
  field_name TEXT;
  result JSONB;
BEGIN
  -- Check permissions
  IF NOT (app.is_super_admin() OR 
          EXISTS (
            SELECT 1 FROM app.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'manager') 
            AND status = 'active'
          )) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INSUFFICIENT_PERMISSIONS',
        'message', 'Insufficient permissions to create users'
      )
    );
  END IF;
  
  -- Validate required fields
  FOREACH field_name IN ARRAY required_fields LOOP
    IF NOT (p_user_data ? field_name) OR (p_user_data->>field_name) IS NULL OR trim(p_user_data->>field_name) = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'MISSING_REQUIRED_FIELD',
          'message', format('Required field %s is missing or empty', field_name)
        )
      );
    END IF;
  END LOOP;
  
  -- Validate email format and domain
  IF NOT (p_user_data->>'company_email' ~* '^[A-Za-z0-9._%+-]+@erayastyle\.com$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INVALID_EMAIL',
        'message', 'Company email must be a valid @erayastyle.com address'
      )
    );
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM app.users WHERE company_email = lower(trim(p_user_data->>'company_email'))) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'EMAIL_EXISTS',
        'message', 'A user with this email already exists'
      )
    );
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Insert new user
  INSERT INTO app.users (
    id,
    full_name,
    company_email,
    personal_email,
    phone,
    role,
    department,
    status,
    designation,
    work_location,
    employment_type,
    joined_at,
    module_access,
    notes
  ) VALUES (
    new_user_id,
    trim(p_user_data->>'full_name'),
    lower(trim(p_user_data->>'company_email')),
    NULLIF(trim(p_user_data->>'personal_email'), ''),
    NULLIF(trim(p_user_data->>'phone'), ''),
    (p_user_data->>'role')::user_role,
    (p_user_data->>'department')::department,
    COALESCE((p_user_data->>'status')::user_status, 'pending'::user_status),
    NULLIF(trim(p_user_data->>'designation'), ''),
    COALESCE(trim(p_user_data->>'work_location'), 'Patna'),
    COALESCE((p_user_data->>'employment_type')::employment_type, 'Full-time'::employment_type),
    COALESCE((p_user_data->>'joined_at')::date, CURRENT_DATE),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_user_data->'module_access')),
      ARRAY['dashboard']
    ),
    NULLIF(trim(p_user_data->>'notes'), '')
  )
  RETURNING * INTO user_record;
  
  -- Log the creation
  PERFORM app.log_user_action(
    'create_user'::user_action,
    new_user_id,
    jsonb_build_object(
      'created_by', auth.uid(),
      'user_data', p_user_data
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'user', to_jsonb(user_record),
      'tempPasswordSet', false,
      'tempPassword', 'N/A - Create auth account manually',
      'auth_created', false,
      'message', format('User profile for %s created successfully', user_record.full_name)
    )
  );
END;
$$;

-- =============================================================================
-- USER BULK OPERATIONS RPC
-- =============================================================================

-- Bulk update user statuses
CREATE OR REPLACE FUNCTION bulk_update_user_status(
  p_user_ids UUID[],
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  success_count INTEGER := 0;
  failed_count INTEGER := 0;
  results JSONB := '[]'::jsonb;
  operation_result JSONB;
BEGIN
  -- Check permissions
  IF NOT app.is_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INSUFFICIENT_PERMISSIONS',
        'message', 'Only super admins can perform bulk operations'
      )
    );
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('active', 'pending', 'suspended', 'on_leave', 'inactive', 'resigned', 'terminated') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INVALID_STATUS',
        'message', 'Invalid status value'
      )
    );
  END IF;
  
  -- Process each user
  FOREACH user_id IN ARRAY p_user_ids LOOP
    operation_result := admin_set_user_status(user_id, p_status, p_reason);
    
    IF (operation_result->>'success')::boolean THEN
      success_count := success_count + 1;
      results := results || jsonb_build_object(
        'user_id', user_id,
        'success', true
      );
    ELSE
      failed_count := failed_count + 1;
      results := results || jsonb_build_object(
        'user_id', user_id,
        'success', false,
        'error', operation_result->>'error'
      );
    END IF;
  END LOOP;
  
  -- Log bulk operation
  PERFORM app.log_user_action(
    'update_user'::user_action,
    p_user_ids[1], -- Use first user ID as representative
    jsonb_build_object(
      'operation', 'bulk_status_update',
      'target_count', array_length(p_user_ids, 1),
      'status', p_status,
      'reason', p_reason,
      'success_count', success_count,
      'failed_count', failed_count
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'total_requested', array_length(p_user_ids, 1),
      'successful', success_count,
      'failed', failed_count,
      'results', results
    )
  );
END;
$$;

-- =============================================================================
-- USER SEARCH AND FILTERING RPC
-- =============================================================================

-- Advanced user search with filters and pagination
CREATE OR REPLACE FUNCTION search_users(
  p_search_term TEXT DEFAULT NULL,
  p_roles TEXT[] DEFAULT NULL,
  p_statuses TEXT[] DEFAULT NULL,
  p_departments TEXT[] DEFAULT NULL,
  p_module_access TEXT[] DEFAULT NULL,
  p_joined_after DATE DEFAULT NULL,
  p_joined_before DATE DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
  users_data JSONB;
  offset_value INTEGER;
  sort_column TEXT;
  sort_direction TEXT;
BEGIN
  -- Check basic permissions (users can search within their scope)
  IF NOT app.is_active_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_AUTHENTICATED',
        'message', 'Authentication required'
      )
    );
  END IF;
  
  -- Validate and set defaults
  p_page := GREATEST(1, COALESCE(p_page, 1));
  p_page_size := GREATEST(1, LEAST(100, COALESCE(p_page_size, 20)));
  offset_value := (p_page - 1) * p_page_size;
  
  -- Validate sort parameters
  sort_column := CASE 
    WHEN p_sort_by IN ('created_at', 'full_name', 'joined_at', 'updated_at', 'company_email') 
    THEN p_sort_by
    ELSE 'created_at'
  END;
  
  sort_direction := CASE 
    WHEN UPPER(p_sort_order) IN ('ASC', 'DESC') 
    THEN UPPER(p_sort_order)
    ELSE 'DESC'
  END;
  
  -- Build and execute search query
  WITH filtered_users AS (
    SELECT u.*
    FROM app.users u
    WHERE 
      -- RLS will automatically filter based on user permissions
      (p_search_term IS NULL OR 
       u.full_name ILIKE '%' || p_search_term || '%' OR
       u.company_email ILIKE '%' || p_search_term || '%' OR
       u.designation ILIKE '%' || p_search_term || '%')
      AND (p_roles IS NULL OR u.role::TEXT = ANY(p_roles))
      AND (p_statuses IS NULL OR u.status::TEXT = ANY(p_statuses))
      AND (p_departments IS NULL OR u.department::TEXT = ANY(p_departments))
      AND (p_module_access IS NULL OR u.module_access && p_module_access)
      AND (p_joined_after IS NULL OR u.joined_at >= p_joined_after)
      AND (p_joined_before IS NULL OR u.joined_at <= p_joined_before)
  ),
  total_count_query AS (
    SELECT COUNT(*) as total FROM filtered_users
  ),
  paginated_users AS (
    SELECT *
    FROM filtered_users
    ORDER BY 
      CASE WHEN sort_column = 'full_name' AND sort_direction = 'ASC' THEN full_name END ASC,
      CASE WHEN sort_column = 'full_name' AND sort_direction = 'DESC' THEN full_name END DESC,
      CASE WHEN sort_column = 'company_email' AND sort_direction = 'ASC' THEN company_email END ASC,
      CASE WHEN sort_column = 'company_email' AND sort_direction = 'DESC' THEN company_email END DESC,
      CASE WHEN sort_column = 'joined_at' AND sort_direction = 'ASC' THEN joined_at END ASC,
      CASE WHEN sort_column = 'joined_at' AND sort_direction = 'DESC' THEN joined_at END DESC,
      CASE WHEN sort_column = 'updated_at' AND sort_direction = 'ASC' THEN updated_at END ASC,
      CASE WHEN sort_column = 'updated_at' AND sort_direction = 'DESC' THEN updated_at END DESC,
      CASE WHEN sort_column = 'created_at' AND sort_direction = 'ASC' THEN created_at END ASC,
      CASE WHEN sort_column = 'created_at' AND sort_direction = 'DESC' THEN created_at END DESC,
      created_at DESC -- fallback
    LIMIT p_page_size OFFSET offset_value
  )
  SELECT 
    (SELECT total FROM total_count_query) as total_count,
    jsonb_agg(to_jsonb(paginated_users.*)) as users_data
  INTO total_count, users_data
  FROM paginated_users;
  
  -- Handle empty results
  IF users_data IS NULL THEN
    users_data := '[]'::jsonb;
    total_count := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'users', users_data,
      'total_count', total_count,
      'page', p_page,
      'page_size', p_page_size,
      'total_pages', CEIL(total_count::DECIMAL / p_page_size),
      'has_next', (p_page * p_page_size) < total_count,
      'has_previous', p_page > 1
    )
  );
END;
$$;

-- =============================================================================
-- USER ACTIVITY LOG RPC
-- =============================================================================

-- Get user activity logs with filtering
CREATE OR REPLACE FUNCTION get_user_activity_logs(
  p_target_user_id UUID DEFAULT NULL,
  p_actions TEXT[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
  logs_data JSONB;
  offset_value INTEGER;
  current_user_record app.users;
BEGIN
  -- Get current user info
  SELECT * INTO current_user_record FROM app.users WHERE auth_user_id = auth.uid();
  
  -- Check permissions
  IF current_user_record IS NULL OR current_user_record.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_AUTHENTICATED',
        'message', 'Authentication required'
      )
    );
  END IF;
  
  -- Validate pagination
  p_page := GREATEST(1, COALESCE(p_page, 1));
  p_page_size := GREATEST(1, LEAST(100, COALESCE(p_page_size, 50)));
  offset_value := (p_page - 1) * p_page_size;
  
  -- Build query based on user permissions
  WITH filtered_logs AS (
    SELECT l.*
    FROM app.user_activity_logs l
    WHERE 
      -- RLS will handle basic filtering, but add extra checks
      (current_user_record.role = 'super_admin' OR 
       l.target_user_id = current_user_record.id OR
       l.actor_auth_user_id = auth.uid())
      AND (p_target_user_id IS NULL OR l.target_user_id = p_target_user_id)
      AND (p_actions IS NULL OR l.action::TEXT = ANY(p_actions))
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
  ),
  total_count_query AS (
    SELECT COUNT(*) as total FROM filtered_logs
  ),
  paginated_logs AS (
    SELECT 
      l.*,
      u.full_name as target_user_name,
      u.company_email as target_user_email,
      actor_u.full_name as actor_name,
      actor_u.company_email as actor_email
    FROM filtered_logs l
    LEFT JOIN app.users u ON l.target_user_id = u.id
    LEFT JOIN auth.users actor_auth ON l.actor_auth_user_id = actor_auth.id
    LEFT JOIN app.users actor_u ON actor_auth.id = actor_u.auth_user_id
    ORDER BY l.created_at DESC
    LIMIT p_page_size OFFSET offset_value
  )
  SELECT 
    (SELECT total FROM total_count_query) as total_count,
    jsonb_agg(to_jsonb(paginated_logs.*)) as logs_data
  INTO total_count, logs_data
  FROM paginated_logs;
  
  -- Handle empty results
  IF logs_data IS NULL THEN
    logs_data := '[]'::jsonb;
    total_count := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'logs', logs_data,
      'total_count', total_count,
      'page', p_page,
      'page_size', p_page_size,
      'total_pages', CEIL(total_count::DECIMAL / p_page_size)
    )
  );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS FOR RPC FUNCTIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_set_user_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_with_validation(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_user_status(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], DATE, DATE, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_logs(UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION admin_set_user_status(UUID, TEXT, TEXT) IS 'Updates user status with proper validation and audit logging';
COMMENT ON FUNCTION create_user_with_validation(JSONB) IS 'Creates a new user with comprehensive validation and audit logging';
COMMENT ON FUNCTION bulk_update_user_status(UUID[], TEXT, TEXT) IS 'Updates multiple users status in a single operation';
COMMENT ON FUNCTION search_users(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], DATE, DATE, INTEGER, INTEGER, TEXT, TEXT) IS 'Advanced user search with filters, pagination, and sorting';
COMMENT ON FUNCTION get_user_activity_logs(UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) IS 'Retrieves user activity logs with filtering and pagination';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== RPC FUNCTIONS MIGRATION COMPLETED ===';
  RAISE NOTICE 'Enhanced RPC functions available:';
  RAISE NOTICE '✓ admin_set_user_status - Enhanced status management';
  RAISE NOTICE '✓ create_user_with_validation - Robust user creation';
  RAISE NOTICE '✓ bulk_update_user_status - Bulk operations support';
  RAISE NOTICE '✓ search_users - Advanced search with pagination';
  RAISE NOTICE '✓ get_user_activity_logs - Comprehensive audit log access';
END $$;