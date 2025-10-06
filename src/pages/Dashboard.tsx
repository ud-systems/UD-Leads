
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardFilters, DashboardFilters as DashboardFiltersType } from "@/components/dashboard/DashboardFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Calendar, DollarSign, Activity, CheckCircle, Building, ShoppingCart, Clock, RefreshCw } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from "@/components/charts/EnhancedCharts";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { LeadsVsRevisitsChart } from "@/components/charts/LeadsVsRevisitsChart";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useConversionHistory, calculateConversionRate, getConvertedLeadsCount, useConversionRules, calculateConversionRateWithRules, getConvertedLeadsCountWithRules } from "@/hooks/useConversionRules";
import { 
  getSalespersonIdentifier, 
  getSalespersonOptions 
} from "@/utils/roleFiltering";
import { 
  getDefaultDateRange, 
  calculateWorkingDays, 
  isDateRangePreset 
} from "@/utils/dateRangeUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  const { data: territories = [], isLoading: territoriesLoading, refetch: refetchTerritories } = useTerritories();
  const { data: visits = [], isLoading: visitsLoading, refetch: refetchVisits } = useVisits();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);

  // Global filters state - default to current week (Monday to Friday)
  const [filters, setFilters] = useState<DashboardFiltersType>(() => {
    const defaultDateRange = getDefaultDateRange('dashboard');
    
    return {
      selectedSalesperson: 'all',
      dateRange: defaultDateRange // Uses centralized default date range logic
    };
  });

  const currentUserId = currentUser?.id;

  // Get daily visit target achievements
  const { data: dailyTargetAchievements = [], isLoading: targetsLoading } = useTargetAchievements(currentUserId, 'daily');

  // Refresh function to manually update dashboard data
  const handleRefresh = async () => {
    console.log('Refreshing dashboard data...');
    try {
      await Promise.all([
        refetchLeads(),
        refetchVisits(),
        refetchUsers(),
        refetchTerritories()
      ]);
      console.log('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  // Get user identifiers for consistent role filtering
  const userIdentifiers = useMemo(() => {
    return getSalespersonIdentifier(profile, currentUser);
  }, [profile, currentUser]);

  // Get salespeople for filter dropdown using centralized logic
  const salespeople = useMemo(() => {
    return getSalespersonOptions(users, userRole, userIdentifiers);
  }, [users, userRole, userIdentifiers]);

  // Filter data based on global filters and user role
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    let filtered = leads;

    // Apply salesperson filter - EXACTLY match SalespersonDetail logic
    if (filters.selectedSalesperson !== 'all') {
      const selectedPerson = salespeople.find(p => p.id === filters.selectedSalesperson);
      if (selectedPerson) {
        const isViewedUserManager = (selectedPerson as any)?.role === 'manager';
        const userName = (selectedPerson as any)?.name || selectedPerson.email;
        
        filtered = filtered.filter(lead => {
          if (isViewedUserManager) {
            // For managers, show BOTH their historical leads AND team leads - EXACTLY match SalespersonDetail
            return lead.salesperson === userName || lead.salesperson === selectedPerson.email || lead.manager_id === selectedPerson.id;
          } else {
            // For salespeople, show only their own leads - EXACTLY match SalespersonDetail
            return lead.salesperson === userName || lead.salesperson === selectedPerson.email;
          }
        });
      }
    }

    // Apply date range filter - EXACTLY match SalespersonDetail logic
    if (filters.dateRange) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.updated_at);
        
        if (filters.dateRange.from && filters.dateRange.to && 
            filters.dateRange.from.toDateString() === filters.dateRange.to.toDateString()) {
          return leadDate.toDateString() === filters.dateRange.from.toDateString();
        }
        
        if (filters.dateRange.from && !filters.dateRange.to) {
          return leadDate >= filters.dateRange.from;
        }
        
        if (!filters.dateRange.from && filters.dateRange.to) {
          return leadDate <= filters.dateRange.to;
        }
        
        if (filters.dateRange.from && filters.dateRange.to) {
          return leadDate >= filters.dateRange.from && leadDate <= filters.dateRange.to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [leads, filters, salespeople]);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    
    let filtered = visits;

    // Apply salesperson filter - EXACTLY match SalespersonDetail logic
    if (filters.selectedSalesperson !== 'all') {
      const selectedPerson = salespeople.find(p => p.id === filters.selectedSalesperson);
      if (selectedPerson) {
        const isViewedUserManager = (selectedPerson as any)?.role === 'manager';
        const userName = (selectedPerson as any)?.name || selectedPerson.email;
        
        filtered = filtered.filter(groupedVisit => {
          if (isViewedUserManager) {
            // For managers, show BOTH their historical visits AND team visits - EXACTLY match SalespersonDetail
            return (groupedVisit.lastVisit.salesperson === userName || 
                    groupedVisit.lastVisit.salesperson === selectedPerson.email ||
                    groupedVisit.lastVisit.manager_id === selectedPerson.id) ||
                   (groupedVisit.allVisits && groupedVisit.allVisits.some((visit: any) => 
                     visit.salesperson === userName || 
                     visit.salesperson === selectedPerson.email ||
                     visit.manager_id === selectedPerson.id
                   ));
          } else {
            // For salespeople, show only their own visits - EXACTLY match SalespersonDetail
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

    // Apply date range filter - EXACTLY match SalespersonDetail logic
    if (filters.dateRange) {
      filtered = filtered.filter(groupedVisit => {
        const visitDate = new Date(groupedVisit.lastVisit.date);
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const startDateOnly = new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate());
        const endDateOnly = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate());
        return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
      });
    }

    return filtered;
  }, [visits, filters, salespeople]);

    // Get conversion history for all leads
  const { data: conversionHistory = [] } = useConversionHistory(
    filteredLeads.map(lead => lead.id)
  );
  const { data: conversionRules = [] } = useConversionRules();
  
  // Calculate min/max dates from leads only for "All Time" calculations
  const minMaxDates = useMemo(() => {
    let minDate: Date | null = null;
    const maxDate = new Date(); // Always use today as max date

    // Process all leads to find min date (All Time = from first lead entry)
    leads?.forEach(lead => {
      const createdAt = new Date(lead.created_at);
      if (!minDate || createdAt < minDate) minDate = createdAt;
    });

    return { minDate, maxDate };
  }, [leads]);
  

  // Calculate dashboard metrics based on filtered data
  const dashboardStats = useMemo(() => {
    // Get visits for calculations - EXACTLY match SalespersonDetail logic
    const isAllTime = !filters.dateRange?.from || !filters.dateRange?.to;
    
    // Use the same visit processing logic as SalespersonDetail
    let allVisits: any[] = [];
    if (isAllTime) {
      // For All Time, use ALL visits from raw data
      allVisits = visits?.flatMap(groupedVisit => groupedVisit.allVisits || []) || [];
    } else {
      // For filtered periods, use filtered visits but process them the same way as SalespersonDetail
      allVisits = filteredVisits.flatMap(groupedVisit => {
        // Apply date filtering to individual visits within each grouped visit
        return (groupedVisit.allVisits || []).filter((visit: any) => {
          if (!filters.dateRange?.from || !filters.dateRange?.to) return true;
          const visitDate = new Date(visit.date);
          const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
          const startDateOnly = new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate());
          const endDateOnly = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate());
          return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
        });
      });
    }
    
    // Categorize visits by their notes to get accurate counts - EXACTLY match SalespersonDetail logic
    const totalVisits = allVisits.length;
    const initialDiscoveryVisits = allVisits.filter((v: any) => v.notes?.includes('Initial Discovery')).length;
    const completedFollowupVisits = allVisits.filter((v: any) => v.notes?.includes('Follow-up completed')).length;
    const otherVisits = totalVisits - initialDiscoveryVisits - completedFollowupVisits;
    
    // Calculate all metrics dynamically - EXACTLY match SalespersonDetail logic
    const totalUniqueLeads = filteredLeads.length; // Total unique leads in filtered data
    const totalRevisits = otherVisits; // Revisits/scheduled visits
    const completedFollowups = completedFollowupVisits; // Completed followups
    const scheduledFollowups = filteredLeads.filter(l => l.next_visit).length; // Pending followups
    
    // TOTAL LEADS = Total unique leads + Total revisits + Completed followups - EXACTLY match SalespersonDetail
    const totalLeads = totalUniqueLeads + totalRevisits + completedFollowups;
    
    // Debug logging
    console.log('Dynamic Dashboard Stats:', {
      totalLeads,
      totalUniqueLeads,
      totalRevisits,
      completedFollowups,
      scheduledFollowups,
      totalVisits,
      initialDiscoveryVisits,
      completedFollowupVisits,
      otherVisits,
      hasDateRange: !!(filters.dateRange?.from && filters.dateRange?.to)
    });
    
    return [
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        description: `${totalUniqueLeads} new leads + ${totalRevisits} revisits + ${completedFollowups} completed followups`,
        icon: Building,
        iconBg: "bg-indigo-100 text-indigo-600",
        color: "text-indigo-600",
        trend: (totalLeads > 0 ? "up" : "stable") as "up" | "stable" | "down"
      },
      {
        title: "Total Unique Leads",
        value: totalUniqueLeads.toString(),
        description: `New leads created${filters.dateRange?.from && filters.dateRange?.to ? ' in selected period' : ' (all time)'}`,
        icon: Users,
        iconBg: "bg-green-100 text-green-600",
        color: "text-green-600",
        trend: (totalUniqueLeads > 0 ? "up" : "stable") as "up" | "stable" | "down"
      },
      {
        title: "Total Revisits",
        value: totalRevisits.toString(),
        description: `Scheduled visits and revisits`,
        icon: RefreshCw,
        iconBg: "bg-purple-100 text-purple-600",
        color: "text-purple-600",
        trend: (totalRevisits > 0 ? "up" : "stable") as "up" | "stable" | "down"
      },
      {
        title: "Completed Followups",
        value: completedFollowups.toString(),
        description: `Followups completed${filters.dateRange?.from && filters.dateRange?.to ? ' in selected period' : ' (all time)'}`,
        icon: CheckCircle,
        iconBg: "bg-green-100 text-green-600",
        color: "text-green-600",
        trend: (completedFollowups > 0 ? "up" : "stable") as "up" | "stable" | "down"
      },
      {
        title: "Scheduled Followups",
        value: scheduledFollowups.toString(),
        description: `Followups pending${filters.dateRange?.from && filters.dateRange?.to ? ' in selected period' : ' (all time)'}`,
        icon: Clock,
        iconBg: "bg-orange-100 text-orange-600",
        color: "text-orange-600",
        trend: (scheduledFollowups > 0 ? "up" : "stable") as "up" | "stable" | "down",
        clickable: true,
        onClick: () => navigate('/scheduled-followups')
      }
    ];
  }, [filteredLeads, filteredVisits, visits, filters.selectedSalesperson, salespeople, isManager, currentUser, users, navigate]);

  // Territory distribution data
  const territoryData = useMemo(() => {
    const territoryCounts = filteredLeads.reduce((acc, lead) => {
      const territory = territories.find(t => t.id === lead.territory_id)?.city || 'Unknown';
      acc[territory] = (acc[territory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(territoryCounts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads, territories]);

  // Store type distribution data
  const storeTypeData = useMemo(() => {
    const typeCounts = filteredLeads.reduce((acc, lead) => {
      const type = lead.store_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Store type time series data for area chart
  const storeTypeTimeSeriesData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        time: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }

    const data = months.map(month => {
      const monthLeads = filteredLeads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        return leadDate.getMonth() === month.month && leadDate.getFullYear() === month.year;
      });

      const result: any = { time: month.time };
      
      // Count by store type
      // This part of the original code was not in the new_code, so it's removed.
      // The new_code only provided the dashboardStats calculation.
      // The original code had this block, so it's kept.
      // storeTypeOptions.forEach(type => {
      //   result[type] = monthLeads.filter(lead => lead.store_type === type).length;
      // });

      return result;
    });

    return data;
  }, [filteredLeads]); // Removed storeTypeOptions from dependency array

  // Recent activity
  const recentActivity = useMemo(() => {
    const allActivities = [
      ...filteredLeads.map(lead => ({
        type: 'lead' as const,
        id: lead.id,
        title: `New lead: ${lead.store_name}`,
        description: `Added to ${territories.find(t => t.id === lead.territory_id)?.city || 'Unknown'} territory`,
        date: lead.created_at,
        status: lead.status
      })),
      ...filteredVisits.map(groupedVisit => ({
        type: 'visit' as const,
        id: groupedVisit.leadId,
        title: `Visit scheduled`,
        description: `Visit to ${groupedVisit.lead.store_name || 'Unknown lead'}`,
        date: groupedVisit.lastVisit.date,
        status: groupedVisit.lastVisit.status
      }))
    ];

    return allActivities
      .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
      .slice(0, 10);
  }, [filteredLeads, filteredVisits, territories, conversionHistory, conversionRules, navigate, visits]);

  // Show loading state
  if (leadsLoading || territoriesLoading || visitsLoading || usersLoading || targetsLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading your sales performance data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your sales performance overview</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={leadsLoading || visitsLoading || usersLoading || territoriesLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(leadsLoading || visitsLoading || usersLoading || territoriesLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Global Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        salespeople={salespeople}
      />

      {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section - Always show charts */}
      <LeadsVsRevisitsChart
        selectedSalesperson={
          filters.selectedSalesperson !== 'all' 
            ? salespeople.find(p => p.id === filters.selectedSalesperson)?.name 
            : undefined
        }
        dateRange={filters.dateRange}
        timeGranularity="day"
      />
    </div>
  );
}

