import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
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

interface WeeklySpendData {
  spendRange: string;
  count: number;
  percentage: number;
}

interface WeeklySpendAreaChartProps {
  data: WeeklySpendData[];
  title?: string;
  description?: string;
}

export function WeeklySpendAreaChart({ 
  data, 
  title = "Weekly Spend Distribution",
  description = "Distribution of leads by weekly spend range"
}: WeeklySpendAreaChartProps) {
  
  // Transform data for area chart
  const chartData = data.map(item => ({
    spendRange: item.spendRange,
    leads: item.count,
    percentage: item.percentage
  }));

  // Color scheme for different spend ranges
  const getColor = (index: number) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No weekly spend data available</p>
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
          <DollarSign className="h-5 w-5" />
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
                dataKey="spendRange" 
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
                  value, 
                  name === 'leads' ? 'Number of Leads' : 'Percentage'
                ]}
                labelFormatter={(label) => `Weekly Spend: ${label}`}
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
                stroke="#10b981"
                strokeWidth={3}
                fill="#10b981"
                fillOpacity={0.6}
                name="Number of Leads"
              />
              
              {/* Secondary Area for Percentage (if needed) */}
              {data.length > 1 && (
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Percentage"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((item, index) => (
            <div key={index} className="text-center p-3 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">
                {item.spendRange}
              </div>
              <div className="text-2xl font-bold" style={{ color: getColor(index) }}>
                {item.count}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
