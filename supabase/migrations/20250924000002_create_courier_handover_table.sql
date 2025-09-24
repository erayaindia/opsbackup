-- Create courier_handover_items table
CREATE TABLE public.courier_handover_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100),
    awb_number VARCHAR(100),
    courier VARCHAR(50) NOT NULL,
    bag_letter VARCHAR(10),
    batch_id VARCHAR(50),
    scan_type VARCHAR(20) DEFAULT 'awb' CHECK (scan_type IN ('awb', 'order_id')),
    scanned_by UUID REFERENCES auth.users(id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_manual_entry BOOLEAN DEFAULT FALSE,
    is_duplicate BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'scanned' CHECK (status IN ('scanned', 'handed_over', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_courier_handover_order_number ON courier_handover_items(order_number);
CREATE INDEX idx_courier_handover_awb_number ON courier_handover_items(awb_number);
CREATE INDEX idx_courier_handover_courier ON courier_handover_items(courier);
CREATE INDEX idx_courier_handover_scanned_at ON courier_handover_items(scanned_at);
CREATE INDEX idx_courier_handover_scanned_by ON courier_handover_items(scanned_by);
CREATE INDEX idx_courier_handover_status ON courier_handover_items(status);
CREATE INDEX idx_courier_handover_bag_letter ON courier_handover_items(bag_letter);

-- Create composite index for common queries
CREATE INDEX idx_courier_handover_courier_bag_status ON courier_handover_items(courier, bag_letter, status);

-- Enable Row Level Security
ALTER TABLE courier_handover_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- Policy for SELECT (read) - authenticated users can read all records
CREATE POLICY "Allow authenticated users to read courier handover items"
    ON courier_handover_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for INSERT (create) - authenticated users can create records
CREATE POLICY "Allow authenticated users to create courier handover items"
    ON courier_handover_items
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = scanned_by AND auth.uid() = created_by);

-- Policy for UPDATE - authenticated users can update records they created or are assigned to
CREATE POLICY "Allow authenticated users to update courier handover items"
    ON courier_handover_items
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = scanned_by)
    WITH CHECK (auth.uid() = updated_by);

-- Policy for DELETE - authenticated users can delete records they created
CREATE POLICY "Allow authenticated users to delete courier handover items"
    ON courier_handover_items
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = scanned_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_courier_handover_items_updated_at
    BEFORE UPDATE ON courier_handover_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check for duplicates
CREATE OR REPLACE FUNCTION check_courier_handover_duplicate(
    p_order_number VARCHAR DEFAULT NULL,
    p_awb_number VARCHAR DEFAULT NULL,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM courier_handover_items
        WHERE (
            (p_order_number IS NOT NULL AND order_number = p_order_number) OR
            (p_awb_number IS NOT NULL AND awb_number = p_awb_number)
        )
        AND status != 'cancelled'
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get handover summary
CREATE OR REPLACE FUNCTION get_courier_handover_summary(
    p_courier VARCHAR DEFAULT NULL,
    p_bag_letter VARCHAR DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_items BIGINT,
    courier VARCHAR,
    bag_letter VARCHAR,
    scanned_today BIGINT,
    manual_entries BIGINT,
    duplicates_prevented BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_items,
        chi.courier,
        chi.bag_letter,
        COUNT(CASE WHEN DATE(chi.scanned_at) = CURRENT_DATE THEN 1 END)::BIGINT as scanned_today,
        COUNT(CASE WHEN chi.is_manual_entry = true THEN 1 END)::BIGINT as manual_entries,
        COUNT(CASE WHEN chi.is_duplicate = true THEN 1 END)::BIGINT as duplicates_prevented
    FROM courier_handover_items chi
    WHERE
        (p_courier IS NULL OR chi.courier = p_courier)
        AND (p_bag_letter IS NULL OR chi.bag_letter = p_bag_letter)
        AND (p_date_from IS NULL OR DATE(chi.scanned_at) >= p_date_from)
        AND (p_date_to IS NULL OR DATE(chi.scanned_at) <= p_date_to)
        AND chi.status != 'cancelled'
    GROUP BY chi.courier, chi.bag_letter
    ORDER BY chi.courier, chi.bag_letter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE courier_handover_items TO authenticated;
GRANT EXECUTE ON FUNCTION check_courier_handover_duplicate TO authenticated;
GRANT EXECUTE ON FUNCTION get_courier_handover_summary TO authenticated;