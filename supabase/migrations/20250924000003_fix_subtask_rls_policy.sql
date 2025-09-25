-- Fix RLS policy infinite recursion issue
-- Drop the problematic subtasks_select policy that causes infinite recursion

-- Drop the problematic subtask policy if it exists
DROP POLICY IF EXISTS "subtasks_select" ON tasks;

-- The existing task policies from previous migrations already handle subtask access appropriately
-- No additional policies are needed since subtasks are just tasks with parent_task_id set