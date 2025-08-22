# Duplicate Visits Cleanup Instructions

This guide will help you fix the duplicate visits in your database that were created before the code fix.

## 🎯 What This Does

- Identifies duplicate visits for the same lead on the same date
- Keeps the **first** visit (earliest created_at) for each lead-date combination
- Removes all subsequent duplicate visits
- Provides audit logs of what was cleaned up

## 📋 Prerequisites

1. **Backup your database** (recommended)
2. **Access to Supabase Dashboard** or **Supabase CLI**
3. **Service Role Key** (for programmatic access)

## 🚀 Method 1: Supabase Dashboard (Recommended)

### Step 1: Preview Duplicates
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/simple-duplicate-cleanup.sql`
4. Run the script to see what duplicates exist

### Step 2: Run Cleanup
1. In the same SQL Editor, uncomment the cleanup section (remove the `/*` and `*/`)
2. Run the script again to perform the actual cleanup

## 🚀 Method 2: Supabase CLI

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js dotenv
```

### Step 2: Set Environment Variables
Create or update your `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Run the Cleanup Script
```bash
node scripts/fix-duplicate-visits.js
```

## 🚀 Method 3: Direct Migration

### Step 1: Apply Migration
```bash
supabase db push
```

This will run the migration file: `supabase/migrations/20250118000001_fix_duplicate_visits.sql`

## 📊 What You'll See

### Before Cleanup:
- Dashboard shows inflated visit counts
- Lead details show incorrect visit numbers
- Performance metrics are skewed

### After Cleanup:
- Accurate visit completion metrics
- Correct visit counts in lead details
- Proper performance tracking

## 🔍 Verification

After running the cleanup:

1. **Check Dashboard**: Visit completion metrics should be accurate
2. **Check Lead Details**: Visit counts should be correct
3. **Check Database**: Run the preview script again - should show no duplicates

## ⚠️ Important Notes

- **This is irreversible**: Duplicate visits will be permanently deleted
- **First visit kept**: The earliest visit for each lead-date combination is preserved
- **Audit trail**: Cleanup actions are logged in `system_settings` table
- **Future prevention**: The code fix prevents new duplicates from being created

## 🆘 Troubleshooting

### "No duplicates found"
- Your database is already clean! No action needed.

### "Permission denied"
- Make sure you're using the Service Role Key, not the anon key
- Check your Supabase permissions

### "Script failed"
- Check the error messages in the console
- Verify your environment variables are correct
- Ensure you have proper database access

## 📞 Support

If you encounter any issues:
1. Check the error messages carefully
2. Verify your Supabase configuration
3. Review the audit logs in the `system_settings` table

## 🎉 Success!

Once completed, your visit counts will be accurate and your dashboard metrics will reflect the true performance of your sales team.
