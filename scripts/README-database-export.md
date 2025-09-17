# Database Export Guide

This guide explains how to export your Supabase database schema and data for duplication or backup purposes.

## 🚀 Quick Export Methods

### Method 1: Automated Script (Recommended)
```bash
npm run export-database
```

This will create a `database-export` folder with:
- **JSON file**: Complete data export with schema
- **SQL file**: SQL INSERT statements for all data
- **Summary file**: Export statistics and file list

### Method 2: Manual SQL Export
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run queries from `scripts/export-sql-queries.sql`
4. Download results as CSV or copy the data

### Method 3: Supabase CLI (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Export database
supabase db dump --data-only > database-export.sql
```

## 📁 Export Files Generated

### JSON Export (`database-export-YYYY-MM-DD.json`)
```json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "supabaseUrl": "https://your-project.supabase.co",
  "tables": {
    "profiles": {
      "schema": [...],
      "data": {...}
    }
  },
  "systemSettings": [...],
  "sqlStatements": "..."
}
```

### SQL Export (`database-export-YYYY-MM-DD.sql`)
```sql
-- Database Export for Supabase Project
-- Export Date: 2024-01-15T10:30:00.000Z

-- Data for table: profiles
INSERT INTO profiles (id, email, name) VALUES ('uuid', 'user@example.com', 'John Doe');
-- ... more INSERT statements
```

## 🔄 Importing to New Project

### Step 1: Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose organization and enter project details
4. Wait for project to be created

### Step 2: Import Schema
1. Go to **SQL Editor** in new project
2. Run your migration files or create tables manually
3. Set up Row Level Security (RLS) policies

### Step 3: Import Data
1. Use the generated SQL file
2. Run INSERT statements in SQL Editor
3. Or use the JSON file with a custom import script

### Step 4: Update Environment Variables
```bash
# Update your .env file
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-new-service-key
```

## 📊 Tables Exported

The export script includes these tables:
- `profiles` - User profiles
- `leads` - Lead data
- `visits` - Visit records
- `territories` - Territory information
- `user_preferences` - User settings
- `system_settings` - System configuration
- `status_colors` - Status color schemes
- `conversion_rules` - Business rules
- `company_logos` - Logo data
- `suppliers` - Supplier information

## ⚠️ Important Notes

### Security Considerations
- **Service Role Key**: The export script uses your service role key
- **Sensitive Data**: Be careful with user emails and personal data
- **Environment Variables**: Don't commit service keys to version control

### Data Limitations
- **File Size**: Large datasets may create large export files
- **Binary Data**: Images and files are exported as URLs, not binary data
- **Real-time**: Export is a snapshot at the time of running

### Storage Buckets
- **Files**: Storage bucket files are not included in the export
- **URLs**: Only file URLs are exported
- **Manual Copy**: You'll need to manually copy files to new project

## 🛠️ Customization

### Adding More Tables
Edit `scripts/export-database.js` and add table names to `TABLES_TO_EXPORT`:

```javascript
const TABLES_TO_EXPORT = [
  'profiles',
  'leads',
  'visits',
  'your_new_table', // Add here
  // ... other tables
];
```

### Filtering Data
Modify the export functions to filter data:

```javascript
// Export only recent data
const { data, error } = await supabase
  .from(tableName)
  .select('*')
  .gte('created_at', '2024-01-01'); // Only data from 2024
```

## 🆘 Troubleshooting

### Common Issues

**"Permission denied"**
- Ensure you're using the service role key
- Check that the key has proper permissions

**"Table not found"**
- Verify table names in `TABLES_TO_EXPORT`
- Check if tables exist in your database

**"Large export files"**
- Consider exporting tables separately
- Use data filtering to reduce export size

### Getting Help
- Check Supabase documentation
- Review the generated error logs
- Test with a small table first

## 📝 Example Usage

```bash
# Export current database
npm run export-database

# Check generated files
ls -la database-export/

# Import to new project (manual steps)
# 1. Create new Supabase project
# 2. Run SQL file in new project
# 3. Update environment variables
# 4. Test your application
```

---

**Happy exporting! 🎉**
