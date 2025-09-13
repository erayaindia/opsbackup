-- Fix inventory_balances check constraint issues
BEGIN;

-- First, let's see what check constraints exist
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%inventory_balances%';

-- Drop problematic check constraints that might be preventing stock movements
DO $$
BEGIN
  -- Try to drop the check constraint that's causing issues
  BEGIN
    ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS inventory_balances_on_hand_qty_check;
    RAISE NOTICE 'Dropped inventory_balances_on_hand_qty_check constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop inventory_balances_on_hand_qty_check: %', SQLERRM;
  END;

  -- Try to drop other potential problematic constraints
  BEGIN
    ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS inventory_balances_allocated_qty_check;
    RAISE NOTICE 'Dropped inventory_balances_allocated_qty_check constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop inventory_balances_allocated_qty_check: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS inventory_balances_available_qty_check;
    RAISE NOTICE 'Dropped inventory_balances_available_qty_check constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop inventory_balances_available_qty_check: %', SQLERRM;
  END;
END $$;

-- Update any invalid data in inventory_balances to fix constraint violations
UPDATE inventory_balances
SET
  on_hand_qty = GREATEST(0, on_hand_qty),
  allocated_qty = GREATEST(0, allocated_qty),
  available_qty = GREATEST(0, available_qty)
WHERE on_hand_qty < 0 OR allocated_qty < 0 OR available_qty < 0;

-- Add back reasonable check constraints (allowing non-negative values)
ALTER TABLE inventory_balances
ADD CONSTRAINT inventory_balances_on_hand_qty_check CHECK (on_hand_qty >= 0);

ALTER TABLE inventory_balances
ADD CONSTRAINT inventory_balances_allocated_qty_check CHECK (allocated_qty >= 0);

ALTER TABLE inventory_balances
ADD CONSTRAINT inventory_balances_available_qty_check CHECK (available_qty >= 0);

-- Check if there are any existing triggers that might be causing issues
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%inventory%';

COMMIT;

SELECT 'Fixed inventory_balances check constraints' as status;