import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
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

interface LeadsGrowthChartProps {
  selectedSalesperson?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  timeGranularity?: 'day' | 'week' | 'month' | 'year';
}

export function LeadsGrowthChart({ 
  selectedSalesperson, 
  dateRange,
  timeGranularity = 'day'
}: LeadsGrowthChartProps) {

  // Fetch real data from database
  const { data: chartData = [], isLoading, error } = useLeadsGrowth({
    selectedSalesperson,
    dateRange,
    timeGranularity
  });

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
    
    // Fallback to current date
    const today = new Date();
    switch (timeGranularity) {
      case 'day':
        return today.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        return `Week of ${today.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        })}`;
      case 'month':
        return today.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      case 'year':
        return today.getFullYear().toString();
      default:
        return '';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Leads Growth Over Time
                {selectedSalesperson && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedSalesperson}
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Loading leads data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Leads Growth Over Time
                {selectedSalesperson && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedSalesperson}
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Error loading leads data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Failed to load chart data</p>
              <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
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
                <TrendingUp className="h-5 w-5 text-green-600" />
                Leads Growth Over Time
                {selectedSalesperson && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {selectedSalesperson}
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            No leads data available for the selected filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No leads found</p>
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
              <TrendingUp className="h-5 w-5 text-green-600" />
              Leads Growth Over Time
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
                  value: 'Number of Leads', 
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
                  name === 'cumulative' ? 'Cumulative Leads' : 'Daily Leads'
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
              />
              
              {/* Cumulative Leads - Dark Green Line with Area */}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#16a34a"
                strokeWidth={3}
                fill="#16a34a"
                fillOpacity={0.3}
                name="Cumulative Leads"
              />
              
              {/* Daily Leads - Light Green Line with Area */}
              <Area
                type="monotone"
                dataKey="daily"
                stroke="#22c55e"
                strokeWidth={2}
                fill="#22c55e"
                fillOpacity={0.2}
                name="Daily Leads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 