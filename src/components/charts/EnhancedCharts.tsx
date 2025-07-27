import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveRadar } from '@nivo/radar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target } from 'lucide-react';

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
};

const gradientColors = [
  { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
  { offset: 50, color: 'rgba(59, 130, 246, 0.4)' },
  { offset: 100, color: 'rgba(59, 130, 246, 0.1)' },
];

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

// Enhanced Line Chart
export function EnhancedLineChart({ data, title, description, trend }: {
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
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendOffset: -40,
          legendPosition: 'middle',
          truncateTickAt: 0,
        }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={true}
        areaOpacity={0.15}
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
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
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

// Enhanced Bar Chart
export function EnhancedBarChart({ data, title, description, trend }: {
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
        indexBy="name"
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
          legend: 'Category',
          legendPosition: 'middle',
          legendOffset: 32,
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendPosition: 'middle',
          legendOffset: -40,
          truncateTickAt: 0,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
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
      />
    </ChartCard>
  );
}

// Enhanced Pie Chart
export function EnhancedPieChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        defs={[
          {
            id: 'dots',
            type: 'patternDots',
            background: 'inherit',
            color: 'rgba(255, 255, 255, 0.3)',
            size: 4,
            padding: 1,
            stagger: true,
          },
          {
            id: 'lines',
            type: 'patternLines',
            background: 'inherit',
            color: 'rgba(255, 255, 255, 0.3)',
            rotation: -45,
            lineWidth: 6,
            spacing: 10,
          },
        ]}
        fill={[
          {
            match: {
              id: 'ruby',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'c',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'go',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'python',
            },
            id: 'dots',
          },
          {
            match: {
              id: 'scala',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'lisp',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'elixir',
            },
            id: 'lines',
          },
          {
            match: {
              id: 'javascript',
            },
            id: 'lines',
          },
        ]}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#999',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
        theme={{
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

// Enhanced Heatmap Chart
export function EnhancedHeatmapChart({ data, title, description, trend }: {
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
          legend: 'X Axis',
          legendOffset: 36,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Y Axis',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
        animate={true}
        motionStiffness={80}
        motionDamping={9}
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

// Enhanced Radar Chart
export function EnhancedRadarChart({ data, title, description, trend }: {
  data: any[];
  title: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <ChartCard title={title} description={description} trend={trend}>
      <ResponsiveRadar
        data={data}
        keys={['value']}
        indexBy="taste"
        valueScale={{ type: 'linear', min: 0, max: 'auto' }}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        borderColor={{ from: 'color' }}
        gridLabelOffset={36}
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
        motionStiffness={90}
        motionDamping={15}
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
      />
    </ChartCard>
  );
} 