## Performance Stats Rework - Accuracy and Consistency

### Goals
- Ensure team-level stats add up exactly to the sum of individual visits.
- Use robust, structured categorization for visits (no reliance on free-form notes).
- Present mathematically correct values for Unique Leads, Revisits, and Followups.

### Problems Found
1. Revisits were derived by subtracting specific note patterns from total visits, leading to inflated counts.
2. Team stats were computed from a different data pass than individual member stats, causing mismatches.
3. `visit_type` existed in the schema but wasn’t consistently set on creation.

### Key Fixes
1. Categorization updated to use lead-based grouping and `visit_type` where available, with safe fallback.
2. Team totals now derive from the same underlying dataset used for member visits.
3. New visits are assigned `visit_type` automatically:
   - First-ever visit to a lead → `initial`
   - Subsequent visit to the same lead → `revisit`

### File Changes
- `src/pages/PerformanceEnhanced.tsx`
  - Replaced note-string heuristics with lead-based grouping:
    - Unique Leads: count of distinct `lead_id` across manager/team visit sets.
    - Revisits: `totalVisits - uniqueLeads - completedFollowups`.
  - Team totals now computed by summing individual member visits to ensure parity.
  - Fallback to legacy note detection only where `visit_type` is missing for followup completion.

- `src/components/visits/RecordVisitDialog.tsx`
  - On submit, compute `visit_type` by checking existing visits for the selected `lead_id`.
  - Persist `visit_type` with the visit record.

### Logic Definitions
- Total Visits: all visit rows for the cohort (manager + team) within the time window.
- Unique Leads: number of unique `lead_id` visited in the same cohort/time.
- Completed Followups: visits where `visit_type === 'followup' && status === 'completed'` (with a minimal fallback to note match for old rows).
- Revisits: `TotalVisits - UniqueLeads - CompletedFollowups`.

### Why This Is Correct
- A lead can only contribute at most one to Unique Leads within the period.
- Any additional visits to that lead within the period are necessarily revisits.
- Explicit followups are tracked structurally; they’re excluded from revisits to avoid double counting.
- Team totals and individual sums now originate from the same data, eliminating drift.

### Validation Checklist
- [x] Sum of individual member visits equals team Total Visits.
- [x] UniqueLeads + Revisits + CompletedFollowups equals Total Visits.
- [x] New visits get proper `visit_type` values without manual input.
- [x] UI labels updated to clarify semantics (e.g., Team (N) - Unique Leads + Revisits).

### Operational Notes
- Historical rows without `visit_type` continue to work via safe fallbacks; consider a one-off backfill migration later for perfection.
- Scheduled Followups are informational and do not count toward Total Visits.

### Future Enhancements (Optional)
- Add a backfill script to set `visit_type` for historical data based on first-visit timestamps per `lead_id`.
- Expose a small legend/info tooltip in UI describing how each metric is calculated.

