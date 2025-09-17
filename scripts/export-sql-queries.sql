-- Supabase Database Export Queries
-- Run these queries in your Supabase SQL Editor to export your database

-- ==============================================
-- 1. EXPORT ALL TABLE DATA
-- ==============================================

-- Export Profiles
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles;
SELECT * FROM profiles;

-- Export Leads
SELECT 'leads' as table_name, count(*) as row_count FROM leads;
SELECT * FROM leads;

-- Export Visits
SELECT 'visits' as table_name, count(*) as row_count FROM visits;
SELECT * FROM visits;

-- Export Territories
SELECT 'territories' as table_name, count(*) as row_count FROM territories;
SELECT * FROM territories;

-- Export User Preferences
SELECT 'user_preferences' as table_name, count(*) as row_count FROM user_preferences;
SELECT * FROM user_preferences;

-- Export System Settings
SELECT 'system_settings' as table_name, count(*) as row_count FROM system_settings;
SELECT * FROM system_settings;

-- Export Status Colors
SELECT 'status_colors' as table_name, count(*) as row_count FROM status_colors;
SELECT * FROM status_colors;

-- Export Conversion Rules
SELECT 'conversion_rules' as table_name, count(*) as row_count FROM conversion_rules;
SELECT * FROM conversion_rules;

-- Export Company Logos
SELECT 'company_logos' as table_name, count(*) as row_count FROM company_logos;
SELECT * FROM company_logos;

-- Export Suppliers
SELECT 'suppliers' as table_name, count(*) as row_count FROM suppliers;
SELECT * FROM suppliers;

-- ==============================================
-- 2. EXPORT TABLE SCHEMAS
-- ==============================================

-- Get all table schemas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- ==============================================
-- 3. EXPORT RELATIONSHIPS AND CONSTRAINTS
-- ==============================================

-- Get foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- ==============================================
-- 4. EXPORT INDEXES
-- ==============================================

-- Get all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==============================================
-- 5. EXPORT ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Get RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- 6. EXPORT FUNCTIONS AND TRIGGERS
-- ==============================================

-- Get custom functions
SELECT
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';

-- Get triggers
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ==============================================
-- 7. EXPORT STORAGE BUCKETS AND POLICIES
-- ==============================================

-- Get storage buckets
SELECT * FROM storage.buckets;

-- Get storage policies
SELECT * FROM storage.objects LIMIT 100;

-- ==============================================
-- 8. EXPORT AUTH USERS (if needed)
-- ==============================================

-- Get auth users (be careful with this - contains sensitive data)
-- SELECT id, email, created_at, email_confirmed_at FROM auth.users;

-- ==============================================
-- 9. EXPORT CUSTOM TYPES
-- ==============================================

-- Get custom types
SELECT
    typname,
    typtype,
    typcategory
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'; -- enum types
