# Visit Count Fix - Double Visit Issue Resolution

## Problem Identified
When creating a new lead, the system was creating **two visits** instead of one, causing:
- Dashboard visit completion metrics to show double counts
- Lead details pages to show incorrect visit counts
- Inflated performance metrics

## Root Cause
The issue was caused by **duplicate visit creation** in two different places:

1. **`src/hooks/useLeads.ts`** (lines 108-125): Automatic visit creation within the `useCreateLead` hook
2. **`src/components/leads/CreateLeadDialog.tsx`** (lines 180-200): Manual visit creation after successful lead creation

## Solution Implemented

### 1. Removed Duplicate Visit Creation
- **Removed** the manual visit creation code from `CreateLeadDialog.tsx`
- **Kept** the automatic visit creation in `useLeads.ts` as the single source of truth
- **Removed** unused imports (`useCreateVisit`) from `CreateLeadDialog.tsx`

### 2. Enhanced Automatic Visit Creation
- **Improved** visit notes to be more descriptive: `"Initial Discovery - [lead notes]"` or `"Initial Discovery - Lead discovered during field visit. Store: [store_name]"`
- **Added** duplicate prevention logic to check if a visit already exists for the same lead on the same day
- **Enhanced** error handling and logging

### 3. Business Logic Alignment
- **Maintains** the business logic that "lead creation = initial visit completed"
- **Reflects** real-world scenario where leads are discovered during field visits
- **Reduces** user friction by automatically recording the initial visit

## Files Modified

### `src/components/leads/CreateLeadDialog.tsx`
- Removed duplicate visit creation code (lines 180-200)
- Removed unused `useCreateVisit` import
- Removed unused `createVisit` variable
- Updated success message to reflect automatic visit creation

### `src/hooks/useLeads.ts`
- Enhanced automatic visit creation with better notes
- Added duplicate prevention logic
- Improved error handling and logging
- Maintained transaction-like behavior (delete lead if visit creation fails)

## Benefits
1. **Accurate Metrics**: Dashboard now shows correct visit completion counts
2. **Data Integrity**: Single source of truth for visit creation
3. **Better UX**: Automatic visit recording without manual steps
4. **Prevention**: Duplicate visit prevention for same lead on same day
5. **Descriptive Notes**: Better visit notes for tracking and reporting

## Testing
- Create a new lead and verify only 1 visit is created
- Check dashboard visit completion metrics
- Verify lead details page shows correct visit count
- Test duplicate prevention by attempting to create multiple visits for same lead on same day

## Future Enhancements
- Consider adding `visit_type` field to distinguish between "Initial Discovery", "Follow-up", "Sales Call", etc.
- Add separate metrics for "New Leads Discovered" vs "Follow-up Visits"
- Implement visit scheduling and reminder system
