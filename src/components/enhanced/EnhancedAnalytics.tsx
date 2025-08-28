import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useConversionHistory, calculateConversionRate, getConvertedLeadsCount, useConversionRules, calculateConversionRateWithRules, getConvertedLeadsCountWithRules } from "@/hooks/useConversionRules";
import { TrendingUp, TrendingDown, Calendar, Target, Users, Building } from "lucide-react";

export function EnhancedAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedTerritory, setSelectedTerritory] = useState("all");
  const { data: leads } = useLeads();
  const { data: visits } = useVisits();
  const { data: conversionHistory = [] } = useConversionHistory(
    leads.map(lead => lead.id)
  );
  const { data: conversionRules = [] } = useConversionRules();

  const analyticsData = useMemo(() => {
    if (!leads || !visits) return null;

    const now = new Date();
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter data based on time range
    const filteredVisits = visits.filter(visit => 
      new Date(visit.date) >= cutoffDate
    );

    // Calculate metrics
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => l.last_visit).length;
    const conversionRate = calculateConversionRateWithRules(leads, conversionRules);
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length;
    const scheduledVisits = filteredVisits.filter(v => v.status === 'scheduled').length;

    // Performance by salesperson
    const salesperformance = leads.reduce((acc, lead) => {
      const salesperson = lead.salesperson || 'Unassigned';
      if (!acc[salesperson]) {
        acc[salesperson] = { name: salesperson, total: 0, converted: 0, visits: 0 };
      }
      acc[salesperson].total += 1;
      // Check if this lead has been converted based on conversion history
      const isConverted = conversionHistory.some(conv => conv.lead_id === lead.id);
      if (isConverted) {
        acc[salesperson].converted += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; total: number; converted: number; visits: number }>);

    // Add visit counts
    filteredVisits.forEach(visit => {
      const salesperson = visit.salesperson || 'Unassigned';
      if (salesperformance[salesperson]) {
        salesperformance[salesperson].visits += 1;
      }
    });

    const performanceData = Object.values(salesperformance).map(sp => ({
      name: sp.name,
      conversions: sp.converted,
      visits: sp.visits,
      conversionRate: sp.total > 0 ? (sp.converted / sp.total) * 100 : 0
    }));

    // Monthly trends
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthVisits = visits.filter(v => {
        const visitDate = new Date(v.date);
        return visitDate.getMonth() === date.getMonth() && visitDate.getFullYear() === date.getFullYear();
      }).length;

      monthlyTrends.push({
        name: monthName,
        visits: monthVisits,
        conversions: Math.floor(monthVisits * 0.2) // Estimated conversion rate
      });
    }

    return {
      totalLeads,
      activeLeads,
      conversionRate,
      completedVisits,
      scheduledVisits,
      performanceData,
      monthlyTrends
    };
  }, [leads, visits, timeRange, conversionHistory, conversionRules]);

  const territoryData = useMemo(() => {
    if (!leads) return [];
    
    const territories = leads.reduce((acc, lead) => {
      const territory = lead.city || 'Unassigned';
      if (!acc[territory]) {
        acc[territory] = { name: territory, count: 0, converted: 0 };
      }
      acc[territory].count += 1;
      // Check if this lead has been converted based on conversion history
      const isConverted = conversionHistory.some(conv => conv.lead_id === lead.id);
      if (isConverted) {
        acc[territory].converted += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; count: number; converted: number }>);

    return Object.values(territories).map(t => ({
      name: t.name,
      value: t.count,
      conversions: t.converted,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  }, [leads, conversionHistory, conversionRules]);

  const metrics = [
    {
      title: "Total Leads",
      value: analyticsData?.totalLeads || 0,
      change: "+12%",
      trend: "up",
      icon: Building
    },
    {
      title: "Active Leads",
      value: analyticsData?.activeLeads || 0,
      change: "+8%",
      trend: "up",
      icon: Users
    },
    {
      title: "Conversion Rate",
      value: `${analyticsData?.conversionRate.toFixed(1)}%`,
      change: "+2.3%",
      trend: "up",
      icon: Target
    },
    {
      title: "Completed Visits",
      value: analyticsData?.completedVisits || 0,
      change: "-5%",
      trend: "down",
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Territories</SelectItem>
            {territoryData.map(territory => (
              <SelectItem key={territory.name} value={territory.name}>
                {territory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Trends"
          type="line"
          data={analyticsData?.monthlyTrends || []}
        />
        
        <ChartCard
          title="Territory Distribution"
          type="pie"
          data={territoryData}
        />
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>Performance metrics by salesperson</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.performanceData.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{performer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {performer.visits} visits, {performer.conversions} conversions
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={performer.conversionRate > 20 ? "default" : "secondary"}>
                    {performer.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}