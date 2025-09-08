-- Create lead_notes table for individual notes/comments
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'visit', 'followup', 'system')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optional fields for visit-related notes
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    salesperson_name TEXT,
    
    -- Optional fields for followup-related notes  
    followup_id UUID REFERENCES public.followups(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_note_type ON public.lead_notes(note_type);

-- Enable RLS (Row Level Security)
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view lead notes for leads they have access to" ON public.lead_notes
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM public.leads 
            WHERE 
                -- Admin can see all
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
                OR
                -- Manager can see their territory leads
                (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager') 
                 AND manager_id = auth.uid())
                OR
                -- Salesperson can see their assigned leads
                (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'salesperson') 
                 AND salesperson = (SELECT name FROM public.profiles WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Users can create lead notes for leads they have access to" ON public.lead_notes
    FOR INSERT WITH CHECK (
        lead_id IN (
            SELECT id FROM public.leads 
            WHERE 
                -- Admin can create for all
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
                OR
                -- Manager can create for their territory leads
                (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager') 
                 AND manager_id = auth.uid())
                OR
                -- Salesperson can create for their assigned leads
                (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'salesperson') 
                 AND salesperson = (SELECT name FROM public.profiles WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Users can update their own lead notes" ON public.lead_notes
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own lead notes" ON public.lead_notes
    FOR DELETE USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_lead_notes_updated_at
    BEFORE UPDATE ON public.lead_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
