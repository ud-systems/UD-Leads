import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface StoreTypeData {
  storeType: string;
  count: number;
  percentage: number;
  conversionRate?: number;
}

interface StoreTypeAreaChartProps {
  data: StoreTypeData[];
  title?: string;
  description?: string;
}

export function StoreTypeAreaChart({ 
  data, 
  title = "Store Type Performance",
  description = "Performance analysis by store type"
}: StoreTypeAreaChartProps) {
  
  // Transform data for area chart
  const chartData = data.map(item => ({
    storeType: item.storeType,
    leads: item.count,
    percentage: item.percentage,
    conversionRate: item.conversionRate || 0
  }));

  // Color scheme for different store types
  const getColor = (index: number) => {
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No store type data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
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
                dataKey="storeType" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 11 }}
                interval={0}
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
                formatter={(value: any, name: string) => [
                  name === 'leads' ? value : `${value}%`, 
                  name === 'leads' ? 'Number of Leads' : 
                  name === 'percentage' ? 'Percentage' : 'Conversion Rate'
                ]}
                labelFormatter={(label) => `Store Type: ${label}`}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
              />
              
              {/* Main Area for Lead Count */}
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Number of Leads"
              />
              
              {/* Secondary Area for Percentage */}
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="#8b5cf6"
                fillOpacity={0.3}
                name="Percentage"
              />
              
              {/* Tertiary Area for Conversion Rate (if available) */}
              {data.some(item => item.conversionRate !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.2}
                  name="Conversion Rate"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((item, index) => (
            <div key={index} className="text-center p-3 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground truncate">
                {item.storeType}
              </div>
              <div className="text-2xl font-bold" style={{ color: getColor(index) }}>
                {item.count}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}%
              </div>
              {item.conversionRate !== undefined && (
                <div className="text-xs text-green-600 mt-1">
                  {item.conversionRate.toFixed(1)}% conversion
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
