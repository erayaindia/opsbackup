-- Phase 2: Secure RPC for User Status Management
-- Creates SECURITY DEFINER function to safely update user status with audit

-- =============================================================================
-- RPC FUNCTION: app.admin_set_user_status
-- =============================================================================

CREATE OR REPLACE FUNCTION app.admin_set_user_status(
  p_user_id UUID,
  p_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_old_status TEXT;
  v_user_name TEXT;
  v_result JSONB;
BEGIN
  -- Authorization check: only super admins can change status
  IF NOT app.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized. Only super admins can change user status.';
  END IF;

  -- Validate status parameter
  IF p_status NOT IN ('active', 'probation', 'on_leave', 'suspended', 'resigned', 'terminated') THEN
    RAISE EXCEPTION 'Invalid status. Must be one of: active, probation, on_leave, suspended, resigned, terminated';
  END IF;

  -- Check if user exists and get current status
  SELECT status, full_name
  INTO v_old_status, v_user_name
  FROM app.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with ID: %', p_user_id;
  END IF;

  -- Don't update if status is the same
  IF v_old_status = p_status THEN
    RAISE EXCEPTION 'User already has status: %', p_status;
  END IF;

  -- Update user status
  UPDATE app.users 
  SET status = p_status 
  WHERE id = p_user_id;

  -- Insert audit log
  INSERT INTO app.user_activity_logs (
    actor_auth_user_id,
    target_user_id,
    action,
    module,
    details
  ) VALUES (
    auth.uid(),
    p_user_id,
    'set_status',
    'admin/users',
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status,
      'user_name', v_user_name,
      'changed_at', NOW()
    )
  );

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_status', v_old_status,
    'new_status', p_status,
    'user_name', v_user_name,
    'changed_by', auth.uid(),
    'changed_at', NOW()
  );

  RETURN v_result;

EXCEPTION 
  WHEN OTHERS THEN
    -- Return error result
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', p_user_id,
      'attempted_status', p_status
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECURITY & PERMISSIONS
-- =============================================================================

-- Revoke public access
REVOKE ALL ON FUNCTION app.admin_set_user_status(UUID, TEXT) FROM PUBLIC;

-- Grant execute permission to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION app.admin_set_user_status(UUID, TEXT) TO authenticated;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION app.admin_set_user_status(UUID, TEXT) IS 
'Securely updates user status with audit logging. Only super admins can call this function.
Parameters:
- p_user_id: UUID of the user to update
- p_status: New status (active, probation, on_leave, suspended, resigned, terminated)
Returns: JSONB with success/error information and audit details';

-- =============================================================================
-- TESTING QUERIES (Run these to verify the function works)
-- =============================================================================

-- Test 1: Call function as super admin (should work)
-- SELECT app.admin_set_user_status('<user_id>', 'suspended');

-- Test 2: Call function as non-super-admin (should fail)
-- Should return error about authorization

-- Test 3: Check audit logs after status change
-- SELECT * FROM app.user_activity_logs WHERE action = 'set_status' ORDER BY created_at DESC LIMIT 5;

-- =============================================================================