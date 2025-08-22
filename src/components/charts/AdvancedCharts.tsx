import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveRadar } from '@nivo/radar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target, Users, MapPin } from 'lucide-react';

// Modern color palette
const chartColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
  yellow: '#eab308',
  lime: '#84cc16',
  emerald: '#10b981',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
};

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function ChartCard({ title, description, children, trend, className }: ChartCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-2">
              <Badge variant={trend.isPositive ? 'default' : 'destructive'} className="text-xs">
                {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trend.value}%
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Area Chart using Line Chart with area
export function AreaChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Time',
          legendOffset: 36,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        enableArea={true}
        areaOpacity={0.6}
        useMesh={true}
        legends={[
          {
            anchor: 'top',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -20,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fill: '#333333',
              },
            },
            ticks: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#333333',
              },
            },
          },
          grid: {
            line: {
              stroke: '#dddddd',
              strokeWidth: 1,
            },
          },
          legends: {
            text: {
              fontSize: 12,
              fill: '#333333',
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#333333',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
          },
        }}
        colors={[chartColors.primary, chartColors.secondary, chartColors.accent]}
      />
    </ChartCard>
  );
}

// Enhanced Bar Chart with stacked data
export function StackedBarChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveBar
        data={data}
        keys={['value1', 'value2', 'value3']}
        indexBy="name"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        groupMode="stacked"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Category',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fill: '#333333',
              },
            },
            ticks: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#333333',
              },
            },
          },
          grid: {
            line: {
              stroke: '#dddddd',
              strokeWidth: 1,
            },
          },
          legends: {
            text: {
              fontSize: 12,
              fill: '#333333',
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#333333',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
          },
        }}
      />
    </ChartCard>
  );
}

// Enhanced Heatmap for performance analysis
export function PerformanceHeatmap({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        forceSquare={true}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Category',
          legendPosition: 'middle',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Metric',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.8]],
        }}
        animate={true}
        hoverTarget="cell"
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fill: '#333333',
              },
            },
            ticks: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#333333',
              },
            },
          },
          grid: {
            line: {
              stroke: '#dddddd',
              strokeWidth: 1,
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#333333',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
          },
        }}
        colors={{
          type: 'sequential',
          scheme: 'blues',
        }}
      />
    </ChartCard>
  );
}

// Enhanced Radar Chart for multi-dimensional analysis
export function RadarChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveRadar
        data={data}
        keys={['value1', 'value2', 'value3', 'value4', 'value5']}
        indexBy="metric"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        borderColor={{ from: 'color' }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={36}
        enableDots={true}
        dotSize={10}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color' }}
        enableDotLabel={true}
        dotLabel="value"
        dotLabelYOffset={-12}
        colors={{ scheme: 'nivo' }}
        fillOpacity={0.25}
        blendMode="multiply"
        animate={true}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fill: '#333333',
              },
            },
            ticks: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#333333',
              },
            },
          },
          grid: {
            line: {
              stroke: '#dddddd',
              strokeWidth: 1,
            },
          },
          legends: {
            text: {
              fontSize: 12,
              fill: '#333333',
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#333333',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
          },
        }}
      />
    </ChartCard>
  );
}

// Funnel Chart using Bar Chart
export function FunnelChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="stage"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Sales Stage',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Count',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fill: '#333333',
              },
            },
            ticks: {
              line: {
                stroke: '#777777',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#333333',
              },
            },
          },
          grid: {
            line: {
              stroke: '#dddddd',
              strokeWidth: 1,
            },
          },
          legends: {
            text: {
              fontSize: 12,
              fill: '#333333',
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#333333',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
          },
        }}
      />
    </ChartCard>
  );
} 