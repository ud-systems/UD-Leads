
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Users, Award, FileText, Download, Calendar, DollarSign, Activity, BarChart3, CheckCircle, XCircle, RefreshCw, MapPin, Building, ShoppingCart } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { EnhancedLineChart, EnhancedBarChart, EnhancedPieChart } from "@/components/charts/EnhancedCharts";
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

  // Filter data based on user role and date range
  const roleFilteredLeads = useMemo(() => {
    if (!leads || !currentUser) return [];
    
    let filteredLeads = leads;
    
    // Apply role-based filtering
    if (userRole === 'salesperson') {
      filteredLeads = leads.filter(lead => lead.salesperson === currentUser.email);
    } else if (userRole === 'manager') {
      filteredLeads = leads.filter(lead => lead.manager_id === currentUser.id);
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
  }, [leads, userRole, currentUser, dateRange]);

  // Key Metrics
  const keyMetrics = useMemo(() => {
    const totalLeads = roleFilteredLeads.length;
    const convertedLeads = roleFilteredLeads.filter(l => l.status === 'Converted').length;
    const inDiscussionLeads = roleFilteredLeads.filter(l => l.status === 'In Discussion').length;
    const trialOrderLeads = roleFilteredLeads.filter(l => l.status === 'Trial Order').length;
    const newProspectLeads = roleFilteredLeads.filter(l => l.status === 'New Prospect').length;
    
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
    const discussionRate = totalLeads > 0 ? ((inDiscussionLeads / totalLeads) * 100) : 0;
    const trialRate = totalLeads > 0 ? ((trialOrderLeads / totalLeads) * 100) : 0;
    
    const highValueLeads = roleFilteredLeads.filter(l => l.buying_power === 'High').length;
    const mediumValueLeads = roleFilteredLeads.filter(l => l.buying_power === 'Medium').length;
    const lowValueLeads = roleFilteredLeads.filter(l => l.buying_power === 'Low').length;
    
    return {
      totalLeads,
      convertedLeads,
      inDiscussionLeads,
      trialOrderLeads,
      newProspectLeads,
      conversionRate,
      discussionRate,
      trialRate,
      highValueLeads,
      mediumValueLeads,
      lowValueLeads
    };
  }, [roleFilteredLeads]);

  // Lead Status Distribution
  const leadStatusData = useMemo(() => [
    { name: 'New Prospects', value: keyMetrics.newProspectLeads, color: '#3b82f6' },
    { name: 'In Discussion', value: keyMetrics.inDiscussionLeads, color: '#f59e0b' },
    { name: 'Trial Order', value: keyMetrics.trialOrderLeads, color: '#8b5cf6' },
    { name: 'Converted', value: keyMetrics.convertedLeads, color: '#10b981' }
  ], [keyMetrics]);

  // Buying Power Distribution
  const buyingPowerData = useMemo(() => [
    { name: 'High Value', value: keyMetrics.highValueLeads, color: '#10b981' },
    { name: 'Medium Value', value: keyMetrics.mediumValueLeads, color: '#f59e0b' },
    { name: 'Low Value', value: keyMetrics.lowValueLeads, color: '#ef4444' }
  ], [keyMetrics]);

  // Store Type Analysis
  const storeTypeData = useMemo(() => {
    const storeTypeStats = roleFilteredLeads.reduce((acc, lead) => {
      const type = lead.store_type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { total: 0, converted: 0 };
      }
      acc[type].total++;
      if (lead.status === 'Converted') acc[type].converted++;
      return acc;
    }, {} as Record<string, { total: number; converted: number }>);

         return Object.entries(storeTypeStats)
       .map(([type, stats]) => ({
         name: type,
         total: (stats as any).total,
         converted: (stats as any).converted,
         conversionRate: (stats as any).total > 0 ? (((stats as any).converted / (stats as any).total) * 100).toFixed(1) : '0'
       }))
       .sort((a, b) => b.total - a.total);
  }, [roleFilteredLeads]);

  // Territory Performance
  const territoryData = useMemo(() => {
    const territoryStats = roleFilteredLeads.reduce((acc, lead) => {
      const territory = territories.find(t => t.id === lead.territory_id)?.name || 'Unknown';
      if (!acc[territory]) {
        acc[territory] = { total: 0, converted: 0, inDiscussion: 0 };
      }
      acc[territory].total++;
      if (lead.status === 'Converted') acc[territory].converted++;
      if (lead.status === 'In Discussion') acc[territory].inDiscussion++;
      return acc;
    }, {} as Record<string, { total: number; converted: number; inDiscussion: number }>);

         return Object.entries(territoryStats)
       .map(([territory, stats]) => ({
         name: territory,
         total: (stats as any).total,
         converted: (stats as any).converted,
         inDiscussion: (stats as any).inDiscussion,
         conversionRate: (stats as any).total > 0 ? (((stats as any).converted / (stats as any).total) * 100).toFixed(1) : '0'
       }))
       .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
  }, [roleFilteredLeads, territories]);

  // Salesperson Performance
  const salespersonData = useMemo(() => {
    const salespersonStats = roleFilteredLeads.reduce((acc, lead) => {
      const salesperson = lead.salesperson || 'Unknown';
      if (!acc[salesperson]) {
        acc[salesperson] = { total: 0, converted: 0, inDiscussion: 0 };
      }
      acc[salesperson].total++;
      if (lead.status === 'Converted') acc[salesperson].converted++;
      if (lead.status === 'In Discussion') acc[salesperson].inDiscussion++;
      return acc;
    }, {} as Record<string, { total: number; converted: number; inDiscussion: number }>);

         return Object.entries(salespersonStats)
       .map(([salesperson, stats]) => ({
         name: salesperson,
         total: (stats as any).total,
         converted: (stats as any).converted,
         inDiscussion: (stats as any).inDiscussion,
         conversionRate: (stats as any).total > 0 ? (((stats as any).converted / (stats as any).total) * 100).toFixed(1) : '0'
       }))
       .sort((a, b) => b.converted - a.converted);
  }, [roleFilteredLeads]);

  // Monthly Lead Trends - Fixed format for Nivo Line Chart
  const monthlyTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const leadsData = months.map((month, index) => {
      const monthLeads = roleFilteredLeads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        return leadDate.getFullYear() === currentYear && leadDate.getMonth() === index;
      });
      
      return {
        x: month,
        y: monthLeads.length
      };
    });

    const conversionsData = months.map((month, index) => {
      const monthLeads = roleFilteredLeads.filter(lead => {
        if (!lead.created_at) return false;
        const leadDate = new Date(lead.created_at);
        return leadDate.getFullYear() === currentYear && leadDate.getMonth() === index;
      });
      
      const conversions = monthLeads.filter(lead => lead.status === 'Converted').length;
      
      return {
        x: month,
        y: conversions
      };
    });
    
    return [
      {
        id: 'Leads',
        data: leadsData,
        color: '#3b82f6'
      },
      {
        id: 'Conversions',
        data: conversionsData,
        color: '#10b981'
      }
    ];
  }, [roleFilteredLeads]);

  // Store Type Performance - Fixed format for Nivo Bar Chart
  const storeTypeChartData = useMemo(() => {
    return storeTypeData.map(item => ({
      storeType: item.name,
      conversionRate: parseFloat(item.conversionRate),
      total: (item as any).total,
      converted: (item as any).converted
    }));
  }, [storeTypeData]);

  // Products Analysis
  const productsData = useMemo(() => {
    const productStats = roleFilteredLeads.reduce((acc, lead) => {
      if (lead.products_currently_sold && Array.isArray(lead.products_currently_sold)) {
        lead.products_currently_sold.forEach(product => {
          if (!acc[product]) {
            acc[product] = { total: 0, converted: 0 };
          }
          acc[product].total++;
          if (lead.status === 'Converted') acc[product].converted++;
        });
      }
      return acc;
    }, {} as Record<string, { total: number; converted: number }>);

    return Object.entries(productStats)
      .map(([product, stats]) => ({
        name: product,
        total: stats.total,
        converted: stats.converted,
        conversionRate: stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0'
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
                {users.filter(u => u.role === 'salesperson').map((user) => (
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from && dateRange.to ? 
                `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : 
                'All time'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {keyMetrics.convertedLeads} of {keyMetrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value Leads</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.highValueLeads}</div>
            <p className="text-xs text-muted-foreground">
              {keyMetrics.totalLeads > 0 ? ((keyMetrics.highValueLeads / keyMetrics.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Discussion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.inDiscussionLeads}</div>
            <p className="text-xs text-muted-foreground">
              {keyMetrics.discussionRate.toFixed(1)}% of total leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Lead Status Distribution
            </CardTitle>
            <CardDescription>Breakdown of leads by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPieChart
              data={leadStatusData}
              title="Lead Status"
              description="Distribution of leads across different stages"
            />
          </CardContent>
        </Card>

        {/* Buying Power Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Buying Power Distribution
            </CardTitle>
            <CardDescription>Leads categorized by buying power</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPieChart
              data={buyingPowerData}
              title="Buying Power"
              description="Distribution of leads by buying power"
            />
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Lead Trends
            </CardTitle>
            <CardDescription>Lead generation and conversion trends</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedLineChart
              data={monthlyTrends}
              title="Monthly Trends"
              description="Lead generation and conversion trends by month"
            />
          </CardContent>
        </Card>

        {/* Store Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Store Type Performance
            </CardTitle>
            <CardDescription>Conversion rates by store type</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedBarChart
              data={storeTypeChartData}
              title="Store Type Conversion"
              description="Conversion rates by store type"
            />
          </CardContent>
        </Card>
      </div>

      {/* Territory and Salesperson Performance */}
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
                      {territory.converted}/{territory.total} converted
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
                      {salesperson.converted}/{salesperson.total} converted
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
                  {product.converted}/{product.total} converted
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
