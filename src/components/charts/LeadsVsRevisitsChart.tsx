import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { useLeadsGrowth } from "@/hooks/useLeadsGrowth";
import { useVisits } from "@/hooks/useVisits";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface LeadsVsRevisitsChartProps {
  selectedSalesperson?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  timeGranularity?: 'day' | 'week' | 'month' | 'year';
}

export function LeadsVsRevisitsChart({ 
  selectedSalesperson, 
  dateRange,
  timeGranularity = 'day'
}: LeadsVsRevisitsChartProps) {

  // Fetch data
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();

  // Calculate chart data
  const chartData = useMemo(() => {
    if (leadsLoading || visitsLoading) return [];

    // Filter leads based on role and selected salesperson
    let filteredLeads = leads;
    if (isSalesperson && currentUser) {
      const salespersonName = profile?.name || currentUser.email;
      filteredLeads = leads.filter(lead => 
        lead.salesperson === salespersonName
      );
    } else if (isManager && currentUser) {
      const managerName = profile?.name || currentUser.email;
      filteredLeads = leads.filter(lead => 
        lead.manager_id === currentUser.id || lead.salesperson === managerName
      );
    }

    // Apply salesperson filter if specific salesperson is selected
    if (selectedSalesperson && selectedSalesperson !== 'all') {
      const selectedUser = leads.find(l => l.salesperson === selectedSalesperson);
      if (selectedUser) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.salesperson === selectedSalesperson
        );
      }
    }

    // Filter visits based on role and selected salesperson
    let filteredVisits = visits.flatMap(groupedVisit => groupedVisit.allVisits || []);
    if (isSalesperson && currentUser) {
      const salespersonName = profile?.name || currentUser.email;
      filteredVisits = filteredVisits.filter(visit => 
        visit.salesperson === salespersonName
      );
    } else if (isManager && currentUser) {
      const managerName = profile?.name || currentUser.email;
      filteredVisits = filteredVisits.filter(visit => 
        visit.manager_id === currentUser.id || visit.salesperson === managerName
      );
    }

    // Apply salesperson filter to visits
    if (selectedSalesperson && selectedSalesperson !== 'all') {
      filteredVisits = filteredVisits.filter(visit => 
        visit.salesperson === selectedSalesperson
      );
    }

    // Create date range array
    const dates = [];
    
    if (dateRange) {
      // Use provided date range
      const current = new Date(dateRange.from);
      const end = new Date(dateRange.to);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Show all records - find the date range from the data
      const allDates = new Set<string>();
      
      // Get all dates from leads
      filteredLeads.forEach(lead => {
        if (lead.created_at) {
          const dateStr = lead.created_at.split('T')[0];
          allDates.add(dateStr);
        }
      });
      
      // Get all dates from visits
      filteredVisits.forEach(visit => {
        if (visit.date) {
          allDates.add(visit.date);
        }
      });
      
      // Convert to sorted array of dates
      const sortedDates = Array.from(allDates).sort();
      if (sortedDates.length > 0) {
        const startDate = new Date(sortedDates[0]);
        const endDate = new Date(sortedDates[sortedDates.length - 1]);
        
        const current = new Date(startDate);
        while (current <= endDate) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      }
    }

    // Calculate data for each date
    return dates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Count unique leads created on this date
      const uniqueLeadsOnDate = filteredLeads.filter(lead => 
        lead.created_at && lead.created_at.startsWith(dateStr)
      ).length;

      // Count revisits made on this date
      const visitsOnDate = filteredVisits.filter(visit => 
        visit.date === dateStr && visit.status === 'completed'
      );
      
      // Calculate revisits (total visits - unique leads visited)
      const uniqueLeadsVisitedOnDate = new Set(visitsOnDate.map(v => v.lead_id)).size;
      const revisitsOnDate = visitsOnDate.length - uniqueLeadsVisitedOnDate;

      return {
        date: dateStr,
        uniqueLeads: uniqueLeadsOnDate,
        revisits: Math.max(0, revisitsOnDate) // Ensure non-negative
      };
    });
  }, [leads, visits, dateRange, selectedSalesperson, currentUser, profile, userRole, isAdmin, isManager, isSalesperson, leadsLoading, visitsLoading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    switch (timeGranularity) {
      case 'day':
        return date.getDate().toString(); // Just the day number
      case 'week':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
    }
  };

  const getPeriodLabel = () => {
    if (dateRange?.from && dateRange?.to) {
      // If both dates are the same (single day selection)
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return dateRange.from.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        // Date range selection
        return `${dateRange.from.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        })} - ${dateRange.to.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}`;
      }
    }
    
    // No date range provided - show "All Time"
    return 'All Time';
  };

  // Show loading state
  if (leadsLoading || visitsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Leads vs Revisits Analysis
                {selectedSalesperson && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedSalesperson}
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Loading leads and visits data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Leads vs Revisits Analysis
                {selectedSalesperson && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedSalesperson}
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            No data available for the selected filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No data found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or date range</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-left">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Leads vs Revisits Analysis
              {selectedSalesperson && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {selectedSalesperson}
                </span>
              )}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-left">
          {getPeriodLabel()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 20, bottom: 40 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatDate}
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 11 }}
                domain={[0, 'auto']}
                padding={{ top: 20, bottom: 20 }}
                label={{ 
                  value: 'Count', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 }
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  switch (timeGranularity) {
                    case 'day':
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      });
                    case 'week':
                      return `Week of ${date.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}`;
                    case 'month':
                      return date.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric'
                      });
                    case 'year':
                      return date.getFullYear().toString();
                    default:
                      return value;
                  }
                }}
                formatter={(value: any, name: string) => [
                  value, 
                  name === 'uniqueLeads' ? 'Unique Leads Added' : 'Revisits Made'
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
              />
              
              {/* Unique Leads - Green Line with Area */}
              <Area
                type="monotone"
                dataKey="uniqueLeads"
                stroke="#16a34a"
                strokeWidth={3}
                fill="#16a34a"
                fillOpacity={0.3}
                name="Unique Leads Added"
              />
              
              {/* Revisits - Blue Line with Area */}
              <Area
                type="monotone"
                dataKey="revisits"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Revisits Made"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
