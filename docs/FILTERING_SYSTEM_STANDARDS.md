# 🎯 STANDARDIZED FILTERING SYSTEM DOCUMENTATION

## ⚠️ **CRITICAL RULE: NO EXCEPTIONS**
> **EVERY PAGE MUST USE THE EXACT SAME FILTERING LOGIC AS DASHBOARD**
> Any deviation from this standard will result in data inconsistencies and user confusion.

---

## 📊 **PROOF OF CONCEPT: DASHBOARD SUCCESS**

The Dashboard now serves as the **GOLD STANDARD** for all filtering logic. It has been proven to work correctly with:
- ✅ Accurate data matching between Dashboard and SalespersonDetail pages
- ✅ Consistent role-based filtering (Admin, Manager, Salesperson)
- ✅ Proper date range handling with preset buttons
- ✅ Correct visit data processing and categorization

---

## 🔧 **STANDARDIZED FILTERING COMPONENTS**

### **1. Role-Based Data Filtering Logic**

```typescript
// ✅ STANDARD: Use this exact logic for ALL pages
const filteredLeads = useMemo(() => {
  if (!leads) return [];
  
  let filtered = leads;

  // Apply salesperson filter - EXACTLY match Dashboard logic
  if (selectedSalesperson !== 'all') {
    const selectedPerson = salespeople.find(p => p.id === selectedSalesperson);
    if (selectedPerson) {
      const isViewedUserManager = (selectedPerson as any)?.role === 'manager';
      const userName = (selectedPerson as any)?.name || selectedPerson.email;
      
      filtered = filtered.filter(lead => {
        if (isViewedUserManager) {
          // For managers, show BOTH their historical leads AND team leads
          return lead.salesperson === userName || 
                 lead.salesperson === selectedPerson.email || 
                 lead.manager_id === selectedPerson.id;
        } else {
          // For salespeople, show only their own leads
          return lead.salesperson === userName || 
                 lead.salesperson === selectedPerson.email;
        }
      });
    }
  }

  return filtered;
}, [leads, selectedSalesperson, salespeople]);
```

### **2. Date Range Filtering Logic**

```typescript
// ✅ STANDARD: Use this exact logic for ALL pages
const applyDateRangeFilter = (data: any[], dateRange: DateRange | null) => {
  if (!dateRange) return data;
  
  return data.filter(item => {
    const itemDate = new Date(item.created_at || item.updated_at);
    
    // Single day selection
    if (dateRange.from && dateRange.to && 
        dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return itemDate.toDateString() === dateRange.from.toDateString();
    }
    
    // Only from date
    if (dateRange.from && !dateRange.to) {
      return itemDate >= dateRange.from;
    }
    
    // Only to date
    if (!dateRange.from && dateRange.to) {
      return itemDate <= dateRange.to;
    }
    
    // Date range
    if (dateRange.from && dateRange.to) {
      return itemDate >= dateRange.from && itemDate <= dateRange.to;
    }
    
    return true;
  });
};
```

### **3. Visit Data Processing Logic**

```typescript
// ✅ STANDARD: Use this exact logic for ALL pages
const processVisitData = (filteredVisits: GroupedVisit[], dateRange: DateRange | null) => {
  const isAllTime = !dateRange?.from || !dateRange?.to;
  
  let allVisits: any[] = [];
  if (isAllTime) {
    // For All Time, use ALL visits from raw data
    allVisits = visits?.flatMap(groupedVisit => groupedVisit.allVisits || []) || [];
  } else {
    // For filtered periods, apply date filtering to individual visits
    allVisits = filteredVisits.flatMap(groupedVisit => {
      return (groupedVisit.allVisits || []).filter((visit: any) => {
        if (!dateRange?.from || !dateRange?.to) return true;
        const visitDate = new Date(visit.date);
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
        const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
        return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
      });
    });
  }
  
  // Categorize visits by their notes - EXACTLY match Dashboard logic
  const totalVisits = allVisits.length;
  const initialDiscoveryVisits = allVisits.filter((v: any) => v.notes?.includes('Initial Discovery')).length;
  const completedFollowupVisits = allVisits.filter((v: any) => v.notes?.includes('Follow-up completed')).length;
  const otherVisits = totalVisits - initialDiscoveryVisits - completedFollowupVisits;
  
  return {
    totalVisits,
    initialDiscoveryVisits,
    completedFollowupVisits,
    otherVisits,
    allVisits
  };
};
```

### **4. Visit Filtering Logic**

```typescript
// ✅ STANDARD: Use this exact logic for ALL pages
const filteredVisits = useMemo(() => {
  if (!visits) return [];
  
  let filtered = visits;

  // Apply salesperson filter - EXACTLY match Dashboard logic
  if (selectedSalesperson !== 'all') {
    const selectedPerson = salespeople.find(p => p.id === selectedSalesperson);
    if (selectedPerson) {
      const isViewedUserManager = (selectedPerson as any)?.role === 'manager';
      const userName = (selectedPerson as any)?.name || selectedPerson.email;
      
      filtered = filtered.filter(groupedVisit => {
        if (isViewedUserManager) {
          // For managers, show BOTH their historical visits AND team visits
          return (groupedVisit.lastVisit.salesperson === userName || 
                  groupedVisit.lastVisit.salesperson === selectedPerson.email ||
                  groupedVisit.lastVisit.manager_id === selectedPerson.id) ||
                 (groupedVisit.allVisits && groupedVisit.allVisits.some((visit: any) => 
                   visit.salesperson === userName || 
                   visit.salesperson === selectedPerson.email ||
                   visit.manager_id === selectedPerson.id
                 ));
        } else {
          // For salespeople, show only their own visits
          return (groupedVisit.lastVisit.salesperson === userName || 
                  groupedVisit.lastVisit.salesperson === selectedPerson.email) ||
                 (groupedVisit.allVisits && groupedVisit.allVisits.some((visit: any) => 
                   visit.salesperson === userName || 
                   visit.salesperson === selectedPerson.email
                 ));
        }
      });
    }
  }

  // Apply date range filter - EXACTLY match Dashboard logic
  if (dateRange) {
    filtered = filtered.filter(groupedVisit => {
      const visitDate = new Date(groupedVisit.lastVisit.date);
      const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
      const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
      const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
      return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
    });
  }

  return filtered;
}, [visits, selectedSalesperson, dateRange, salespeople]);
```

---

## 📅 **STANDARDIZED DATE RANGE PRESETS**

### **Preset Button Implementation**

```typescript
// ✅ STANDARD: Use these exact preset buttons on ALL pages
const presetButtons = [
  {
    label: "All Time",
    variant: !dateRange ? "default" : "outline",
    onClick: () => setDateRange(null)
  },
  {
    label: "This Week",
    variant: isDateRangePreset(dateRange, 'thisWeek') ? "default" : "outline",
    onClick: () => setDateRange(getPresetDateRange('thisWeek'))
  },
  {
    label: "Today",
    variant: isDateRangePreset(dateRange, 'today') ? "default" : "outline",
    onClick: () => setDateRange(getPresetDateRange('today'))
  },
  {
    label: "Last 7 Days",
    variant: isDateRangePreset(dateRange, 'last7Days') ? "default" : "outline",
    onClick: () => setDateRange(getPresetDateRange('last7Days'))
  },
  {
    label: "Last 30 Days",
    variant: isDateRangePreset(dateRange, 'last30Days') ? "default" : "outline",
    onClick: () => setDateRange(getPresetDateRange('last30Days'))
  }
];
```

---

## 📊 **STANDARDIZED STAT CALCULATION**

### **Lead Counting Logic**

```typescript
// ✅ STANDARD: Use this exact calculation for ALL pages
const calculateStats = (filteredLeads: Lead[], processedVisits: any) => {
  const {
    totalVisits,
    initialDiscoveryVisits,
    completedFollowupVisits,
    otherVisits
  } = processedVisits;
  
  // Calculate all metrics dynamically - EXACTLY match Dashboard logic
  const totalUniqueLeads = filteredLeads.length; // Total unique leads in filtered data
  const totalRevisits = otherVisits; // Revisits/scheduled visits
  const completedFollowups = completedFollowupVisits; // Completed followups
  const scheduledFollowups = filteredLeads.filter(l => l.next_visit).length; // Pending followups
  
  // TOTAL LEADS = Total unique leads + Total revisits + Completed followups
  const totalLeads = totalUniqueLeads + totalRevisits + completedFollowups;
  
  return {
    totalLeads,
    totalUniqueLeads,
    totalRevisits,
    completedFollowups,
    scheduledFollowups
  };
};
```

---

## 🚫 **FORBIDDEN PRACTICES**

### **❌ NEVER DO THESE:**

1. **Different Role Filtering Logic**
   - ❌ Don't create custom role filtering for specific pages
   - ❌ Don't skip manager historical lead access
   - ❌ Don't use different name/email matching logic

2. **Different Date Range Logic**
   - ❌ Don't use simple `>= from && <= to` comparisons
   - ❌ Don't skip single-day handling
   - ❌ Don't ignore timezone normalization

3. **Different Visit Processing**
   - ❌ Don't skip individual visit date filtering within grouped visits
   - ❌ Don't use different visit categorization logic
   - ❌ Don't ignore "Initial Discovery" and "Follow-up completed" notes

4. **Different Stat Calculations**
   - ❌ Don't use different lead counting formulas
   - ❌ Don't skip visit categorization
   - ❌ Don't ignore the TOTAL LEADS formula

---

## ✅ **MANDATORY CHECKLIST**

Before implementing any filtering on any page:

- [ ] Copy the exact role-based filtering logic from Dashboard
- [ ] Copy the exact date range filtering logic from Dashboard  
- [ ] Copy the exact visit processing logic from Dashboard
- [ ] Copy the exact stat calculation logic from Dashboard
- [ ] Use the same preset date range buttons
- [ ] Test data consistency between pages
- [ ] Verify manager historical + team access works
- [ ] Verify salesperson-only access works
- [ ] Verify admin sees all data works

---

## 📝 **IMPLEMENTATION TEMPLATE**

```typescript
// ✅ COPY THIS TEMPLATE FOR EVERY NEW PAGE

export default function YourPage() {
  // 1. Standard hooks
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();
  const { data: users = [] } = useUsers();
  
  // 2. Standard state
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  // 3. Standard filtering logic (COPY EXACTLY)
  const filteredLeads = useMemo(() => {
    // ... copy exact logic from Dashboard
  }, [leads, selectedSalesperson, dateRange]);
  
  const filteredVisits = useMemo(() => {
    // ... copy exact logic from Dashboard
  }, [visits, selectedSalesperson, dateRange]);
  
  // 4. Standard visit processing (COPY EXACTLY)
  const processedVisits = useMemo(() => {
    // ... copy exact logic from Dashboard
  }, [filteredVisits, dateRange]);
  
  // 5. Standard stat calculation (COPY EXACTLY)
  const stats = useMemo(() => {
    // ... copy exact logic from Dashboard
  }, [filteredLeads, processedVisits]);
  
  // 6. Standard UI components
  return (
    <>
      {/* Standard filter buttons */}
      {/* Standard stat cards */}
      {/* Your page content */}
    </>
  );
}
```

---

## 🎯 **PERMANENT RULE**

> **RULE #1: DASHBOARD IS THE SOURCE OF TRUTH**
> 
> The Dashboard filtering logic is the GOLD STANDARD. Every page must use the EXACT same logic. Any deviation will result in data inconsistencies.
>
> **RULE #2: NO CUSTOM FILTERING**
>
> Never create custom filtering logic for specific pages. Always use the standardized components.
>
> **RULE #3: TEST CONSISTENCY**
>
> Before deploying any filtering changes, test that the data matches between Dashboard and the modified page.

---

## 📈 **SUCCESS METRICS**

- ✅ Data consistency between Dashboard and all other pages
- ✅ Manager historical + team access works everywhere
- ✅ Salesperson-only access works everywhere  
- ✅ Admin sees all data works everywhere
- ✅ Date range filtering produces identical results
- ✅ Stat calculations match across all pages

---

**Last Updated:** January 2025  
**Status:** ACTIVE - All pages must comply  
**Owner:** Development Team  
**Review:** Monthly

