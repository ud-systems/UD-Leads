-- Create territories table
CREATE TABLE IF NOT EXISTS public.territories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "territories_select_policy" ON public.territories
FOR SELECT USING (true);

CREATE POLICY "territories_insert_policy" ON public.territories
FOR INSERT WITH CHECK (true);

CREATE POLICY "territories_update_policy" ON public.territories
FOR UPDATE USING (true);

CREATE POLICY "territories_delete_policy" ON public.territories
FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_territories_name ON public.territories(name);
CREATE INDEX IF NOT EXISTS idx_territories_created_at ON public.territories(created_at); 