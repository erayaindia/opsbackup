-- Bills Database Setup for Supabase
-- Run this script in Supabase SQL Editor

-- 1. Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('stock', 'expense')),
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE,
  tracking_id TEXT,
  vendor_id UUID REFERENCES suppliers(id),
  po_id TEXT,
  grn_id TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  subtotal NUMERIC DEFAULT 0,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT,
  qty NUMERIC DEFAULT 1,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create unique constraint for bill_number per vendor
CREATE UNIQUE INDEX IF NOT EXISTS bills_vendor_number_unique 
ON bills(vendor_id, bill_number);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS bills_vendor_id_idx ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
CREATE INDEX IF NOT EXISTS bills_type_idx ON bills(type);
CREATE INDEX IF NOT EXISTS bills_bill_date_idx ON bills(bill_date);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
CREATE INDEX IF NOT EXISTS bill_items_bill_id_idx ON bill_items(bill_id);

-- 5. Create function to update subtotal automatically
CREATE OR REPLACE FUNCTION update_bill_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bills 
  SET subtotal = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM bill_items 
    WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
  )
  WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers to automatically update subtotal
CREATE TRIGGER bill_items_subtotal_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bill_items
  FOR EACH ROW
  EXECUTE FUNCTION update_bill_subtotal();

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create updated_at trigger
CREATE TRIGGER bills_updated_at_trigger
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Row Level Security (RLS)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (adjust based on your auth requirements)
-- Allow authenticated users to read all bills
CREATE POLICY "Allow authenticated users to read bills" ON bills
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert bills
CREATE POLICY "Allow authenticated users to insert bills" ON bills
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update bills
CREATE POLICY "Allow authenticated users to update bills" ON bills
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete bills
CREATE POLICY "Allow authenticated users to delete bills" ON bills
  FOR DELETE TO authenticated USING (true);

-- Similar policies for bill_items
CREATE POLICY "Allow authenticated users to read bill_items" ON bill_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert bill_items" ON bill_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bill_items" ON bill_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete bill_items" ON bill_items
  FOR DELETE TO authenticated USING (true);

-- 11. Grant permissions
GRANT ALL ON bills TO authenticated;
GRANT ALL ON bill_items TO authenticated;

-- 12. Insert some sample data (optional)
-- INSERT INTO bills (type, bill_number, bill_date, vendor_id, status, subtotal) 
-- VALUES 
--   ('expense', 'EXP-001', CURRENT_DATE, (SELECT id FROM suppliers LIMIT 1), 'pending', 1000.00),
--   ('stock', 'STK-001', CURRENT_DATE, (SELECT id FROM suppliers LIMIT 1), 'paid', 2500.00);

-- Verification queries
-- SELECT 'Bills table created' as status, COUNT(*) as row_count FROM bills;
-- SELECT 'Bill items table created' as status, COUNT(*) as row_count FROM bill_items;
-- SELECT 'Indexes created' as status FROM pg_indexes WHERE tablename IN ('bills', 'bill_items');