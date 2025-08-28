
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Award, FileText, Download, Calendar, DollarSign, Activity, BarChart3, CheckCircle, XCircle, RefreshCw, MapPin, Building, ShoppingCart } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { useConversionHistory, calculateConversionRate, getConvertedLeadsCount } from "@/hooks/useConversionRules";
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from "@/components/charts/EnhancedCharts";
import { WeeklySpendAreaChart } from "@/components/charts/WeeklySpendAreaChart";
import { StoreTypeAreaChart } from "@/components/charts/StoreTypeAreaChart";
import { StatCardsCarousel } from "@/components/ui/stat-cards-carousel";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { DatePicker } from "@/components/ui/date-picker";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
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

  // Filter data based on user role, date range, and selected salesperson
  const roleFilteredLeads = useMemo(() => {
    if (!leads || !currentUser) return [];
    
    let filteredLeads = leads;
    
    // Apply role-based filtering
    if (userRole === 'salesperson') {
      filteredLeads = leads.filter(lead => lead.salesperson === currentUser.email);
    } else if (userRole === 'manager') {
      filteredLeads = leads.filter(lead => lead.manager_id === currentUser.id);
    }
    
    // Apply selected salesperson filtering (for admins/managers)
    if (!isSalesperson && selectedSalesperson !== "all") {
      const selectedUser = users.find((u: any) => u.id === selectedSalesperson);
      if (selectedUser) {
        filteredLeads = filteredLeads.filter(lead => lead.salesperson === selectedUser.email);
        console.log('Filtering for salesperson:', selectedUser.email, 'Filtered leads count:', filteredLeads.length);
      }
    }
    
    // Apply date range filtering
    if (dateRange.from && dateRange.to) {
      filteredLeads = filteredLeads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        return leadDate >= dateRange.from && leadDate <= dateRange.to;
      });
    }
    
    return filteredLeads;
  }, [leads, userRole, currentUser, dateRange, selectedSalesperson, users, isSalesperson]);

  // Key Metrics - Get actual status values from database
  const { data: leadStatusOptions = [] } = useLeadStatusOptions();
  const { data: conversionHistory = [] } = useConversionHistory(
    roleFilteredLeads.map(lead => lead.id)
  );
  
  const keyMetrics = useMemo(() => {
    const totalLeads = roleFilteredLeads.length;
    
    // Create status counts dynamically from database values
    const statusCounts = leadStatusOptions.reduce((acc, status) => {
      acc[status] = roleFilteredLeads.filter(l => l.status === status).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate conversion rate using conversion history
    const conversionRate = calculateConversionRate(roleFilteredLeads, conversionHistory);
    
    // Calculate converted leads count
    const convertedLeads = getConvertedLeadsCount(roleFilteredLeads, conversionHistory);
    
    // Weekly spend distribution
    const highValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === '£10,000+').length;
    const mediumValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === '£5000 - £9999').length;
    const lowValueLeads = roleFilteredLeads.filter(l => l.weekly_spend === 'Less than £1000' || l.weekly_spend === '£1000 - £3000').length;
    
    return {
      totalLeads,
      statusCounts,
      conversionRate,
      highValueLeads,
      mediumValueLeads,
      lowValueLeads
    };
  }, [roleFilteredLeads, conversionHistory, leadStatusOptions]);

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



  // Dynamic Stat Cards based on database status options
  const statCards = useMemo(() => {
    const cards = [
      {
        title: "Total Leads",
        value: keyMetrics.totalLeads,
        description: dateRange.from && dateRange.to ? 
          `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : 
          'All time',
        icon: <Users className="h-4 w-4 text-muted-foreground" />
      },
      {
        title: "Conversion Rate",
        value: `${keyMetrics.conversionRate.toFixed(1)}%`,
        description: `${keyMetrics.statusCounts['Active - Registered'] || 0} of ${keyMetrics.totalLeads} leads`,
        icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
      }
    ];

    // Add dynamic status cards from database
    leadStatusOptions.forEach(status => {
      const count = keyMetrics.statusCounts[status] || 0;
      if (count > 0) {
        cards.push({
          title: status,
          value: count,
          description: `${status.toLowerCase()} leads`,
          icon: status.includes('Active') ? 
            <CheckCircle className="h-4 w-4 text-muted-foreground" /> : 
            <Users className="h-4 w-4 text-muted-foreground" />
        });
      }
    });

    return cards;
  }, [keyMetrics, leadStatusOptions, dateRange, selectedSalesperson]);

  // Products Analysis
  const productsData = useMemo(() => {
    const productStats = roleFilteredLeads.reduce((acc, lead) => {
      if (lead.products_currently_sold && Array.isArray(lead.products_currently_sold)) {
        lead.products_currently_sold.forEach(product => {
          if (!acc[product]) {
            acc[product] = { total: 0, active: 0 };
          }
          acc[product].total++;
          if (lead.status === 'Active') acc[product].active++;
        });
      }
      return acc;
    }, {} as Record<string, { total: number; active: number }>);

    return Object.entries(productStats)
      .map(([product, stats]: [string, { total: number; active: number }]) => ({
        name: product,
        total: stats.total,
        active: stats.active,
        conversionRate: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 products
  }, [roleFilteredLeads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mobile-header-stack">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mobile-filters-stack">
          <DatePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto h-10"
          />
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
                <SelectItem value="all">All Salespeople</SelectItem>
                {users.filter((u: any) => u.role === 'salesperson').map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
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

      {/* Dynamic Stat Cards with Carousel */}
      <StatCardsCarousel cards={statCards} />

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

      {/* Products Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Top Products Analysis
          </CardTitle>
          <CardDescription>Most common products and their conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData.map((product, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">
                  {product.active}/{product.total} active
                </div>
                <div className="text-lg font-bold text-primary">
                  {product.conversionRate}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
