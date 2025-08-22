-- Add manager_id column to profiles table for manager-salesperson relationships
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance on manager_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "profiles_select_team_members" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_team_members" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_team_members" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;

-- Create new RLS policies for manager-salesperson relationships
CREATE POLICY "profiles_select_managed" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR
  role = 'admin' OR
  (role = 'manager' AND auth.uid() = manager_id) OR
  (role = 'manager' AND manager_id IS NULL)
);

CREATE POLICY "profiles_update_managed" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR
  role = 'admin' OR
  (role = 'manager' AND auth.uid() = manager_id)
);

CREATE POLICY "profiles_insert_managed" ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = id OR
  role = 'admin' OR
  (role = 'manager' AND auth.uid() = manager_id)
);

-- Add manager_id to leads table for manager filtering
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance on leads manager_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_manager_id ON public.leads(manager_id);

-- Update leads RLS policies to include manager filtering
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
CREATE POLICY "leads_select_managed" ON public.leads
FOR SELECT USING (
  role = 'admin' OR
  (role = 'manager' AND manager_id = auth.uid()) OR
  (role = 'salesperson' AND salesperson = (SELECT name FROM public.profiles WHERE id = auth.uid()))
);

-- Add manager_id to visits table for manager filtering
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance on visits manager_id lookups
CREATE INDEX IF NOT EXISTS idx_visits_manager_id ON public.visits(manager_id);

-- Update visits RLS policies to include manager filtering
DROP POLICY IF EXISTS "visits_select_policy" ON public.visits;
CREATE POLICY "visits_select_managed" ON public.visits
FOR SELECT USING (
  role = 'admin' OR
  (role = 'manager' AND manager_id = auth.uid()) OR
  (role = 'salesperson' AND salesperson = (SELECT name FROM public.profiles WHERE id = auth.uid()))
); 