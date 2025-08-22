
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  Legend 
} from "recharts";

interface ChartCardProps {
  title: string;
  type: "pie" | "bar" | "line" | "area";
  data: any[];
  className?: string;
  multiSeries?: boolean;
}

const COLORS = ['hsl(221.2 83.2% 53.3%)', 'hsl(142 76% 36%)', 'hsl(43 74% 66%)', 'hsl(0 84% 60%)', 'hsl(197 37% 24%)', 'hsl(27 87% 67%)'];

export function ChartCard({ title, type, data, className, multiSeries = false }: ChartCardProps) {
  const renderChart = () => {
    switch (type) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart 
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(221.2 83.2% 53.3%)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart 
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        if (multiSeries) {
          // Multi-series area chart for store type distribution over time
          return (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart 
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '10px'
                  }}
                />
                {Object.keys(data[0] || {}).filter(key => key !== 'time').map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    strokeOpacity={0.8}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          );
        } else {
          // Single series area chart
          return (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart 
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(221.2 83.2% 53.3%)"
                  fill="hsl(221.2 83.2% 53.3%)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        }
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
