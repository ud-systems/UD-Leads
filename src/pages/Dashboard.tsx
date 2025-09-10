
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardFilters, DashboardFilters as DashboardFiltersType } from "@/components/dashboard/DashboardFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Calendar, DollarSign, Target, Activity, CheckCircle, XCircle, Building, ShoppingCart, Clock, RefreshCw } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from "@/components/charts/EnhancedCharts";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { LeadsGrowthChart } from "@/components/charts/LeadsGrowthChart";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useConversionHistory, calculateConversionRate, getConvertedLeadsCount, useConversionRules, calculateConversionRateWithRules, getConvertedLeadsCountWithRules } from "@/hooks/useConversionRules";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  const { data: territories = [], isLoading: territoriesLoading, refetch: refetchTerritories } = useTerritories();
  const { data: visits = [], isLoading: visitsLoading, refetch: refetchVisits } = useVisits();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { userRole } = useRoleAccess();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);

  // Global filters state - default to All Time
  const [filters, setFilters] = useState<DashboardFiltersType>({
    selectedSalesperson: 'all',
    dateRange: undefined // Default to All Time instead of Today
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

  // Get salespeople for filter dropdown
  const salespeople = useMemo(() => {
    return users
      .filter(user => (user as any).role === 'salesperson')
      .map(user => ({ id: user.id, name: (user as any).name || user.email }));
  }, [users]);

  // Filter data based on global filters and user role
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    let filtered = leads;

    // Apply role-based filtering
    if (userRole === 'salesperson' && currentUser) {
      // Match by either name or email
      const salespersonName = profile?.name || currentUser.email;
      const salespersonEmail = currentUser.email;
      filtered = filtered.filter(lead => 
        lead.salesperson === salespersonName || lead.salesperson === salespersonEmail
      );
    } else if (userRole === 'manager' && currentUser) {
      filtered = filtered.filter(lead => lead.manager_id === currentUser.id);
    }

    // Apply salesperson filter
    if (filters.selectedSalesperson !== 'all') {
      const selectedPerson = salespeople.find(p => p.id === filters.selectedSalesperson);
      if (selectedPerson) {
        filtered = filtered.filter(lead => lead.salesperson === selectedPerson.name);
      }
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.updated_at);
        
        // If both dates are the same (single day selection)
        if (filters.dateRange.from && filters.dateRange.to && 
            filters.dateRange.from.toDateString() === filters.dateRange.to.toDateString()) {
          return leadDate.toDateString() === filters.dateRange.from.toDateString();
        }
        
        // If only from date is selected
        if (filters.dateRange.from && !filters.dateRange.to) {
          return leadDate >= filters.dateRange.from;
        }
        
        // If only to date is selected
        if (!filters.dateRange.from && filters.dateRange.to) {
          return leadDate <= filters.dateRange.to;
        }
        
        // If both dates are selected (range)
        if (filters.dateRange.from && filters.dateRange.to) {
          return leadDate >= filters.dateRange.from && leadDate <= filters.dateRange.to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [leads, userRole, currentUser, filters, salespeople, profile]);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    
    let filtered = visits;

    // Apply role-based filtering
    if (userRole === 'salesperson' && currentUser) {
      // Match by either name or email
      const salespersonName = profile?.name || currentUser.email;
      const salespersonEmail = currentUser.email;
      filtered = filtered.filter(groupedVisit => 
        groupedVisit.lastVisit.salesperson === salespersonName || 
        groupedVisit.lastVisit.salesperson === salespersonEmail
      );
    } else if (userRole === 'manager' && currentUser) {
      filtered = filtered.filter(groupedVisit => groupedVisit.lastVisit.manager_id === currentUser.id);
    }

    // Apply salesperson filter
    if (filters.selectedSalesperson !== 'all') {
      const selectedPerson = salespeople.find(p => p.id === filters.selectedSalesperson);
      if (selectedPerson) {
        filtered = filtered.filter(groupedVisit => groupedVisit.lastVisit.salesperson === selectedPerson.name);
      }
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(groupedVisit => {
        const visitDate = new Date(groupedVisit.lastVisit.date);
        
        // If both dates are the same (single day selection)
        if (filters.dateRange.from && filters.dateRange.to && 
            filters.dateRange.from.toDateString() === filters.dateRange.to.toDateString()) {
          return visitDate.toDateString() === filters.dateRange.from.toDateString();
        }
        
        // If only from date is selected
        if (filters.dateRange.from && !filters.dateRange.to) {
          return visitDate >= filters.dateRange.from;
        }
        
        // If only to date is selected
        if (!filters.dateRange.from && filters.dateRange.to) {
          return visitDate <= filters.dateRange.to;
        }
        
        // If both dates are selected (range)
        if (filters.dateRange.from && filters.dateRange.to) {
          return visitDate >= filters.dateRange.from && visitDate <= filters.dateRange.to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [visits, userRole, currentUser, filters, salespeople, profile]);

    // Get conversion history for all leads
  const { data: conversionHistory = [] } = useConversionHistory(
    filteredLeads.map(lead => lead.id)
  );
  const { data: conversionRules = [] } = useConversionRules();
  
  // Calculate dashboard metrics based on filtered data
  const dashboardStats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    
    // Calculate conversion rate using conversion history
    const conversionRate = calculateConversionRateWithRules(filteredLeads, conversionRules);
    
    // Calculate converted leads count using conversion rules
    const convertedLeads = getConvertedLeadsCountWithRules(filteredLeads, conversionRules);
    
    // Get all visits (not filtered by date) for visit completion stats
    const allVisitsUnfiltered = visits?.flatMap(groupedVisit => groupedVisit.allVisits || []) || [];
    const completedVisits = allVisitsUnfiltered.filter(v => v.status === 'completed').length;
    const scheduledVisits = allVisitsUnfiltered.filter(v => v.status === 'scheduled').length;
    
    // Get filtered visits for daily target calculation
    const allVisits = filteredVisits.flatMap(groupedVisit => groupedVisit.allVisits || []);
    
                    const scheduledFollowups = filteredLeads.filter(l => l.next_visit).length;
    const activeSalespeople = [...new Set(filteredLeads.map(l => l.salesperson).filter(Boolean))].length;

    // Calculate daily target based on number of salespeople (15 per salesperson)
    const totalSalespeople = salespeople.length;
    const dailyTarget = totalSalespeople * 15;
    
    // Calculate visits completed today from actual visits data
    const today = new Date().toISOString().split('T')[0];
    const visitsToday = allVisits.filter(v => v.date === today && v.status === 'completed').length;
    const visitTargetAchievement = dailyTarget > 0 ? (visitsToday / dailyTarget) * 100 : 0;
    const visitTargetCompleted = visitsToday >= dailyTarget;
    
    // Debug logging
    console.log('Dashboard Stats Debug:', {
      today,
      totalSalespeople,
      dailyTarget,
      visitsToday,
      visitTargetAchievement,
      visitTargetCompleted,
      completedVisits,
      scheduledVisits,
      totalVisits: allVisits.length,
      totalVisitsUnfiltered: allVisitsUnfiltered.length
    });
    
    return [
      {
        title: "Daily Visit Target",
        value: `${visitTargetAchievement.toFixed(1)}%`,
        description: `${visitsToday} / ${dailyTarget} visits today`,
        icon: Target,
        iconBg: "bg-blue-100 text-blue-600",
        color: "text-blue-600",
        trend: (visitTargetCompleted ? "up" : visitsToday >= dailyTarget * 0.67 ? "stable" : "down") as "up" | "stable" | "down",
        badge: visitTargetCompleted ? (
          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Target Met
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <XCircle className="h-3 w-3 mr-1" />
            {dailyTarget - visitsToday} More Needed
          </Badge>
        )
      },
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        description: `${convertedLeads} converted (${conversionRate.toFixed(1)}%)`,
        icon: Users,
        iconBg: "bg-green-100 text-green-600",
        color: "text-green-600",
        trend: (conversionRate > 20 ? "up" : conversionRate > 10 ? "stable" : "down") as "up" | "stable" | "down"
      },
      {
        title: "Visit Completion",
        value: `${completedVisits}`,
        description: `${scheduledVisits} scheduled visits`,
        icon: Calendar,
        iconBg: "bg-purple-100 text-purple-600",
        color: "text-purple-600",
        trend: (completedVisits > scheduledVisits * 0.8 ? "up" : "down") as "up" | "stable" | "down"
      },
      {
        title: "Scheduled Followups",
        value: scheduledFollowups.toString(),
        description: `${activeSalespeople} active salespeople`,
        icon: Clock,
        iconBg: "bg-orange-100 text-orange-600",
        color: "text-orange-600",
        trend: (scheduledFollowups > totalLeads * 0.3 ? "up" : "stable") as "up" | "stable" | "down",
        clickable: true,
        onClick: () => navigate('/scheduled-followups')
      }
    ];
  }, [filteredLeads, filteredVisits, dailyTargetAchievements, salespeople]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section - Hide on Today view */}
      {!filters.dateRange || 
       (filters.dateRange.from && filters.dateRange.to && 
        filters.dateRange.from.toDateString() !== filters.dateRange.to.toDateString()) ? (
        <LeadsGrowthChart
          selectedSalesperson={
            filters.selectedSalesperson !== 'all' 
              ? salespeople.find(p => p.id === filters.selectedSalesperson)?.name 
              : undefined
          }
          dateRange={filters.dateRange}
          timeGranularity="day"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Today's Overview
            </CardTitle>
            <CardDescription>
              Focused view of today's performance - growth chart hidden for cleaner daily review
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
