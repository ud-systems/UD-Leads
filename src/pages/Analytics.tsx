
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Award, FileText, Download, Calendar, DollarSign, Activity, BarChart3, CheckCircle, XCircle, RefreshCw, MapPin, Building, ShoppingCart, Clock, Search } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { useConversionHistory, calculateConversionRate, getConvertedLeadsCount, useConversionRules, calculateConversionRateWithRules, getConvertedLeadsCountWithRules } from "@/hooks/useConversionRules";
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from "@/components/charts/EnhancedCharts";
import { WeeklySpendAreaChart } from "@/components/charts/WeeklySpendAreaChart";
import { StoreTypeAreaChart } from "@/components/charts/StoreTypeAreaChart";
import { StatCardsCarousel } from "@/components/ui/stat-cards-carousel";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { getPresetDateRange, isDateRangePreset } from "@/utils/dateRangeUtils";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date()
  });
  
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  const { data: territories = [], isLoading: territoriesLoading, refetch: refetchTerritories } = useTerritories();
  const { data: visits = [], isLoading: visitsLoading, refetch: refetchVisits } = useVisits();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { userRole, isSalesperson, isManager, isAdmin } = useRoleAccess();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);
  
  // Debug visits data for salesperson
  useMemo(() => {
    if (userRole === 'salesperson' && visits.length > 0) {
      console.log('Analytics - Visits data for salesperson:', {
        totalVisits: visits.length,
        sampleVisits: visits.slice(0, 3).map(v => ({
          id: v.id,
          salesperson: v.lastVisit?.salesperson,
          lead_name: v.lastVisit?.leads?.store_name
        }))
      });
    }
  }, [visits, userRole]);

  // Determine page title based on user role
  const pageTitle = isSalesperson ? "My Analytics" : "Lead Analytics";
  const pageDescription = isSalesperson 
    ? "Your lead performance and conversion analytics" 
    : "Comprehensive lead analytics and insights";

  const currentUserId = currentUser?.id;

  // Get target achievements
  const { data: targetAchievements = [], isLoading: targetsLoading, refetch: refetchTargets } = useTargetAchievements(currentUserId, timeRange);

  // Function to refresh all data
  const refreshAllData = () => {
    refetchLeads();
    refetchTerritories();
    refetchVisits();
    refetchUsers();
    refetchTargets();
  };

  // Filter data based on user role, date range, and selected salesperson - EXACTLY match Dashboard logic
  const roleFilteredLeads = useMemo(() => {
    if (!leads) return [];
    
    let filtered = leads;

    // Apply salesperson filter - EXACTLY match Dashboard logic
    if (selectedSalesperson !== 'all') {
      const selectedPerson = users.find((u: any) => u.id === selectedSalesperson);
      if (selectedPerson) {
        const isViewedUserManager = selectedPerson?.role === 'manager';
        const userName = selectedPerson?.name || selectedPerson.email;
        
        filtered = filtered.filter(lead => {
          if (isViewedUserManager) {
            // For managers, show BOTH their historical leads AND team leads - EXACTLY match Dashboard
            return lead.salesperson === userName || lead.salesperson === selectedPerson.email || lead.manager_id === selectedPerson.id;
          } else {
            // For salespeople, show only their own leads - EXACTLY match Dashboard
            return lead.salesperson === userName || lead.salesperson === selectedPerson.email;
          }
        });
      }
    }

    // Apply date range filter - EXACTLY match Dashboard logic
    if (dateRange && dateRange.from && dateRange.to) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.updated_at);
        
        if (dateRange.from && dateRange.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return leadDate.toDateString() === dateRange.from.toDateString();
        }
        
        if (dateRange.from && !dateRange.to) {
          return leadDate >= dateRange.from;
        }
        
        if (!dateRange.from && dateRange.to) {
          return leadDate <= dateRange.to;
        }
        
    if (dateRange.from && dateRange.to) {
        return leadDate >= dateRange.from && leadDate <= dateRange.to;
        }
        
        return true;
      });
    }
    
    return filtered;
  }, [leads, selectedSalesperson, users, dateRange]);

  // Key Metrics - Get actual status values from database
  const { data: leadStatusOptions = [] } = useLeadStatusOptions();
  const { data: conversionHistory = [] } = useConversionHistory(
    roleFilteredLeads.map(lead => lead.id)
  );
  const { data: conversionRules = [] } = useConversionRules();
  
  const keyMetrics = useMemo(() => {
    // Apply date range filtering to visits if date range is provided
    let filteredVisits = visits.flatMap(groupedVisit => groupedVisit.allVisits || []);
    if (dateRange && dateRange.from && dateRange.to) {
      filteredVisits = filteredVisits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate >= dateRange.from! && visitDate <= dateRange.to!;
      });
    }
    
    // Apply role-based filtering to visits
    if (userRole === 'salesperson' && currentUser) {
      const salespersonName = profile?.name || currentUser.email;
      filteredVisits = filteredVisits.filter(visit => 
        visit.salesperson === salespersonName
      );
    } else if (userRole === 'manager' && currentUser) {
      const managerName = profile?.name || currentUser.email;
      filteredVisits = filteredVisits.filter(visit => 
        visit.manager_id === currentUser.id || visit.salesperson === managerName
      );
    }
    
    // Apply salesperson filter to visits if specific salesperson is selected
    if (selectedSalesperson !== "all") {
      const selectedUser = users.find(u => u.id === selectedSalesperson);
      if (selectedUser) {
        filteredVisits = filteredVisits.filter(visit => 
          visit.salesperson === selectedUser.name || visit.salesperson === selectedUser.email
        );
      }
    }
    
    // Categorize visits by their notes to get accurate counts (matching Dashboard logic)
    const totalVisits = filteredVisits.length;
    const initialDiscoveryVisits = filteredVisits.filter(v => v.notes?.includes('Initial Discovery')).length;
    const completedFollowupVisits = filteredVisits.filter(v => v.notes?.includes('Follow-up completed')).length;
    const otherVisits = totalVisits - initialDiscoveryVisits - completedFollowupVisits;
    
    // Calculate metrics using new categorization system
    const totalUniqueLeads = roleFilteredLeads.length; // Total unique leads in filtered data
    const totalRevisits = otherVisits; // Revisits/scheduled visits
    const completedFollowups = completedFollowupVisits; // Completed followups
    const scheduledFollowups = roleFilteredLeads.filter(l => l.next_visit).length; // Pending followups
    
    // TOTAL LEADS = Total unique leads + Total revisits + Completed followups
    const totalLeads = totalUniqueLeads + totalRevisits + completedFollowups;
    
    // Create status counts dynamically from database values
    const statusCounts = leadStatusOptions.reduce((acc, status) => {
      acc[status] = roleFilteredLeads.filter(l => l.status === status).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate conversion rate using conversion rules from settings
    const conversionRate = calculateConversionRateWithRules(roleFilteredLeads, conversionRules);
    
    // Calculate converted leads count using conversion rules
    const convertedLeads = getConvertedLeadsCountWithRules(roleFilteredLeads, conversionRules);
    
    // Weekly spend distribution
    const highValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === '£10,000+').length;
    const mediumValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === '£5000 - £9999').length;
    const lowValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === 'Less than £1000' || l.weekly_spend === '£1000 - £3000').length;
    
    return {
      totalLeads,
      totalUniqueLeads,
      totalRevisits,
      completedFollowups,
      scheduledFollowups,
      statusCounts,
      conversionRate,
      highValueLeads,
      mediumValueLeads,
      lowValueLeads
    };
  }, [roleFilteredLeads, visits, dateRange, userRole, currentUser, profile, selectedSalesperson, users, conversionHistory, leadStatusOptions, conversionRules]);

  // Weekly Spend Distribution - Area Chart Data
  const weeklySpendAreaData = useMemo(() => {
    const spendRanges = [
      'Less than £1000',
      '£1000 - £3000', 
      '£3000 - £5000',
      '£5000 - £9999',
      '£10,000+'
    ];
    
    const totalLeads = roleFilteredLeads.length;
    
    return spendRanges.map(range => {
      const count = roleFilteredLeads.filter(l => l.weekly_spend === range).length;
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      
      return {
        spendRange: range,
        count,
        percentage
      };
    }).filter(item => item.count > 0); // Only show ranges with data
  }, [roleFilteredLeads]);

  // Store Type Analysis - Area Chart Data
  const storeTypeAreaData = useMemo(() => {
    const storeTypeStats = roleFilteredLeads.reduce((acc, lead) => {
      const type = lead.store_type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, active: 0 };
      }
      acc[type].count++;
      if (lead.status === 'Active - Registered' || lead.status === 'Active - Buyer') {
        acc[type].active++;
      }
      return acc;
    }, {} as Record<string, { count: number; active: number }>);

    const totalLeads = roleFilteredLeads.length;

    return Object.entries(storeTypeStats)
      .map(([type, stats]: [string, { count: number; active: number }]) => ({
        storeType: type,
        count: stats.count,
        percentage: totalLeads > 0 ? (stats.count / totalLeads) * 100 : 0,
        conversionRate: stats.count > 0 ? (stats.active / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [roleFilteredLeads]);

  // Territory Performance
  const territoryData = useMemo(() => {
    const territoryStats = roleFilteredLeads.reduce((acc, lead) => {
      const territory = territories.find(t => t.id === lead.territory_id)?.city || 'Unknown';
      if (!acc[territory]) {
        acc[territory] = { total: 0, active: 0, prospect: 0 };
      }
      acc[territory].total++;
      if (lead.status === 'Active') acc[territory].active++;
      if (lead.status === 'Prospect') acc[territory].prospect++;
      return acc;
    }, {} as Record<string, { total: number; active: number; prospect: number }>);

    return Object.entries(territoryStats)
      .map(([territory, stats]: [string, { total: number; active: number; prospect: number }]) => ({
        name: territory,
        total: stats.total,
        active: stats.active,
        prospect: stats.prospect,
        conversionRate: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
  }, [roleFilteredLeads, territories]);

  // Salesperson Performance
  const salespersonData = useMemo(() => {
    const salespersonStats = roleFilteredLeads.reduce((acc, lead) => {
      const salesperson = lead.salesperson || 'Unknown';
      if (!acc[salesperson]) {
        acc[salesperson] = { total: 0, active: 0, prospect: 0 };
      }
      acc[salesperson].total++;
      if (lead.status === 'Active') acc[salesperson].active++;
      if (lead.status === 'Prospect') acc[salesperson].prospect++;
      return acc;
    }, {} as Record<string, { total: number; active: number; prospect: number }>);

    return Object.entries(salespersonStats)
      .map(([salesperson, stats]: [string, { total: number; active: number; prospect: number }]) => ({
        name: salesperson,
        total: stats.total,
        active: stats.active,
        prospect: stats.prospect,
        conversionRate: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.active - a.active);
  }, [roleFilteredLeads]);



  // Dynamic Stat Cards matching Dashboard style
  const dashboardStats = useMemo(() => {
    const totalLeads = keyMetrics.totalLeads;
    const totalUniqueLeads = keyMetrics.totalUniqueLeads;
    const totalRevisits = keyMetrics.totalRevisits;
    const completedFollowups = keyMetrics.completedFollowups;
    const scheduledFollowups = keyMetrics.scheduledFollowups;
    
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
        description: `New leads created${dateRange && dateRange.from && dateRange.to ? ' in selected period' : ' (all time)'}`,
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
        description: `Followups completed${dateRange && dateRange.from && dateRange.to ? ' in selected period' : ' (all time)'}`,
        icon: CheckCircle,
        iconBg: "bg-green-100 text-green-600",
        color: "text-green-600",
        trend: (completedFollowups > 0 ? "up" : "stable") as "up" | "stable" | "down"
      },
      {
        title: "Scheduled Followups",
        value: scheduledFollowups.toString(),
        description: `Followups pending${dateRange && dateRange.from && dateRange.to ? ' in selected period' : ' (all time)'}`,
        icon: Clock,
        iconBg: "bg-orange-100 text-orange-600",
        color: "text-orange-600",
        trend: (scheduledFollowups > 0 ? "up" : "stable") as "up" | "stable" | "down"
      }
    ];
  }, [keyMetrics, dateRange]);

  // Lead Status Progress Bars Card
  const leadStatusProgressData = useMemo(() => {
    const totalLeads = keyMetrics.totalLeads;
    if (totalLeads === 0) return [];
    
    return leadStatusOptions.map(status => {
      const count = keyMetrics.statusCounts[status] || 0;
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      
      return {
        status,
        count,
        percentage,
        color: status.includes('Active') ? 'bg-green-500' : 
               status.includes('Converted') ? 'bg-blue-500' :
               status.includes('Lost') ? 'bg-red-500' : 'bg-gray-500'
      };
    }).filter(item => item.count > 0); // Only show statuses with leads
  }, [keyMetrics, leadStatusOptions]);

  // Top Selling Products Analysis (Top 10 with search)
  const topProductsData = useMemo(() => {
    const productStats = roleFilteredLeads.reduce((acc, lead) => {
      if (lead.top_3_selling_products && Array.isArray(lead.top_3_selling_products)) {
        lead.top_3_selling_products.forEach(product => {
          if (!acc[product]) {
            acc[product] = 0;
          }
          acc[product]++;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    let filteredProducts = Object.entries(productStats)
      .map(([product, count]: [string, number]) => ({
        name: product,
        count: count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count

    // Apply search filter
    if (productSearchTerm.trim()) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
    }

    return filteredProducts.slice(0, 10); // Show top 10
  }, [roleFilteredLeads, productSearchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mobile-header-stack">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mobile-filters-stack">
          {/* Date Range Filter - Preset Buttons - EXACTLY match Dashboard */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!dateRange ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(null)}
              className={!dateRange ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              All Time
            </Button>
            <Button
              variant={isDateRangePreset(dateRange, 'thisWeek') ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(getPresetDateRange('thisWeek'))}
            >
              This Week
            </Button>
            <Button
              variant={isDateRangePreset(dateRange, 'today') ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(getPresetDateRange('today'))}
            >
              Today
            </Button>
            <Button
              variant={isDateRangePreset(dateRange, 'last7Days') ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(getPresetDateRange('last7Days'))}
            >
              Last 7 Days
            </Button>
            <Button
              variant={isDateRangePreset(dateRange, 'last30Days') ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(getPresetDateRange('last30Days'))}
            >
              Last 30 Days
            </Button>
          </div>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-full sm:w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {!isSalesperson && (
            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger className="w-full sm:w-[200px] h-10">
                <SelectValue placeholder="All Salespeople" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {isAdmin ? 'Team Members' : 'Salespeople'}</SelectItem>
                {users.filter((u: any) => isAdmin ? ['salesperson', 'manager'].includes(u.role) : u.role === 'salesperson').map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      {user.role === 'manager' && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          Manager
                        </Badge>
                      )}
                    {user.name || user.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={refreshAllData} className="w-full sm:w-[150px] mobile-filter-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Dynamic Stat Cards matching Dashboard style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Lead Status Progress Bars */}
      {leadStatusProgressData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lead Status Distribution
            </CardTitle>
            <CardDescription>
              Visual breakdown of leads by status with progress bars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadStatusProgressData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.status}</span>
                    <span className="text-muted-foreground">{item.count} leads ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Spend Distribution - Area Chart */}
            <WeeklySpendAreaChart data={weeklySpendAreaData} />

            {/* Store Type Performance - Area Chart */}
            <StoreTypeAreaChart data={storeTypeAreaData} />
          </div>
        </TabsContent>
        <TabsContent value="conversions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Territory Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Territory Performance
                </CardTitle>
                <CardDescription>Lead performance by territory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {territoryData.slice(0, 5).map((territory, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{territory.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {territory.active}/{territory.total} active
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {territory.conversionRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salesperson Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Salesperson Performance
                </CardTitle>
                <CardDescription>Lead performance by salesperson</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salespersonData.slice(0, 5).map((salesperson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{salesperson.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {salesperson.active}/{salesperson.total} active
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {salesperson.conversionRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
          <CardDescription>Top 10 most popular products listed as top selling by stores</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a specific product..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {productSearchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {topProductsData.length} product{topProductsData.length !== 1 ? 's' : ''} matching "{productSearchTerm}"
              </p>
            )}
          </div>
          
          {/* Products Grid */}
          {topProductsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topProductsData.map((product, index) => {
                const maxCount = Math.max(...topProductsData.map(p => p.count));
                const percentage = maxCount > 0 ? (product.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{product.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.count} store{product.count !== 1 ? 's' : ''}
                      </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                  />
                </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% of top product
                    </div>
                  </div>
                );
              })}
              </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {productSearchTerm ? 
                `No products found matching "${productSearchTerm}"` : 
                'No products data available'
              }
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
