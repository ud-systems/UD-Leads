import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';

// Chart colors
const chartColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#22c55e',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280'
};

// Chart Card wrapper
function ChartCard({ 
  title, 
  description, 
  trend, 
  children,
  showTitle = true
}: { 
  title: string; 
  description?: string; 
  trend?: { value: number; isPositive: boolean };
  children: React.ReactNode;
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={trend.isPositive ? "default" : "destructive"}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
            </div>
          )}
        </div>
      )}
      <div className="h-64 w-full">
        {children}
      </div>
    </div>
  );
}

// Enhanced Line Chart using Recharts
export function EnhancedLineChart({ data, title, description, trend, showTitle = true }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  showTitle?: boolean;
}) {
  return (
    <ChartCard title={title} description={description} trend={trend} showTitle={showTitle}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="x" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Line 
            type="monotone" 
            dataKey="Leads" 
            stroke={chartColors.primary} 
            strokeWidth={3}
            dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="Conversions" 
            stroke={chartColors.secondary} 
            strokeWidth={3}
            dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartColors.secondary, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Enhanced Bar Chart using Recharts
export function EnhancedBarChart({ data, title, description, trend, showTitle = true }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  showTitle?: boolean;
}) {
  // Determine if this is a count chart or conversion rate chart
  const isCountChart = data.length > 0 && data[0].hasOwnProperty('count');
  
  return (
    <ChartCard title={title} description={description} trend={trend} showTitle={showTitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="storeType" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => isCountChart ? `${value}` : `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any) => [
              isCountChart ? `${value} stores` : `${value}%`, 
              isCountChart ? 'Store Count' : 'Conversion Rate'
            ]}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="rect"
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Bar 
            dataKey={isCountChart ? "count" : "conversionRate"} 
            fill={chartColors.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Enhanced Pie Chart using Recharts
export function EnhancedPieChart({ data, title, description, trend, showTitle = true }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  showTitle?: boolean;
}) {
  const COLORS = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.danger, chartColors.warning];

  return (
    <ChartCard title={title} description={description} trend={trend} showTitle={showTitle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: any) => [value, name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Enhanced Area Chart using Recharts
export function EnhancedAreaChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="x" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="rect"
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={chartColors.primary} 
            fill={chartColors.primary}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
} 