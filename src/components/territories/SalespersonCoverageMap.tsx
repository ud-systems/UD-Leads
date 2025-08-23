import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, TrendingUp, Calendar, Target, Building } from 'lucide-react';

interface LeadPoint {
  id: string;
  storeName: string;
  latitude: number;
  longitude: number;
  status: string;
  visitCount: number;
  lastVisit: string | null;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface SalespersonCoverageMapProps {
  selectedSalespersonId?: string;
  timeFilter: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
}

export function SalespersonCoverageMap({ 
  selectedSalespersonId,
  timeFilter = 'all'
}: SalespersonCoverageMapProps) {
  
  // For now, we'll create a placeholder map with dots based on coordinates
  // In a real implementation, this would fetch actual lead data
  const mapData = useMemo(() => {
    // Sample data points representing leads with coordinates
    const sampleLeads: LeadPoint[] = [
      {
        id: '1',
        storeName: 'London Store',
        latitude: 51.5074,
        longitude: -0.1278,
        status: 'active',
        visitCount: 5,
        lastVisit: '2024-01-15',
        x: 50,
        y: 30,
        radius: 8,
        color: '#10b981'
      },
      {
        id: '2',
        storeName: 'Manchester Store',
        latitude: 53.4808,
        longitude: -2.2426,
        status: 'pending',
        visitCount: 3,
        lastVisit: '2024-01-12',
        x: 45,
        y: 25,
        radius: 6,
        color: '#f59e0b'
      },
      {
        id: '3',
        storeName: 'Birmingham Store',
        latitude: 52.4862,
        longitude: -1.8904,
        status: 'converted',
        visitCount: 8,
        lastVisit: '2024-01-18',
        x: 48,
        y: 35,
        radius: 10,
        color: '#8b5cf6'
      },
      {
        id: '4',
        storeName: 'Leeds Store',
        latitude: 53.8008,
        longitude: -1.5491,
        status: 'active',
        visitCount: 4,
        lastVisit: '2024-01-14',
        x: 47,
        y: 28,
        radius: 7,
        color: '#10b981'
      },
      {
        id: '5',
        storeName: 'Liverpool Store',
        latitude: 53.4084,
        longitude: -2.9916,
        status: 'inactive',
        visitCount: 1,
        lastVisit: '2024-01-05',
        x: 42,
        y: 30,
        radius: 4,
        color: '#6b7280'
      }
    ];

    return sampleLeads;
  }, [selectedSalespersonId, timeFilter]);

  const stats = useMemo(() => {
    const totalLeads = mapData.length;
    const totalVisits = mapData.reduce((sum, lead) => sum + lead.visitCount, 0);
    const convertedLeads = mapData.filter(lead => lead.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      totalVisits,
      convertedLeads,
      conversionRate
    };
  }, [mapData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Salesperson Territory Coverage
        </CardTitle>
        <CardDescription>
          Geographic distribution of leads based on coordinates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Building className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-lg font-semibold">{stats.totalLeads}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-lg font-semibold">{stats.totalVisits}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Converted</p>
              <p className="text-lg font-semibold">{stats.convertedLeads}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <Calendar className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-semibold">{stats.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Coverage Map</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Converted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>
          
          <div className="relative w-full h-96 bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
            {/* Map visualization with coordinate-based dots */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* Map background/outline */}
              <rect width="100" height="100" fill="#f8fafc" className="dark:fill-gray-800" />
              
              {/* Grid lines for reference */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.2" className="dark:stroke-gray-700"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
              
              {/* Lead points based on coordinates */}
              {mapData.map((point) => (
                <g key={point.id}>
                  {/* Glow effect */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius + 2}
                    fill={point.color + '20'}
                  />
                  {/* Main circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius}
                    fill={point.color}
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                  {/* Store name */}
                  <text
                    x={point.x}
                    y={point.y + point.radius + 6}
                    textAnchor="middle"
                    fontSize="2.5"
                    fill="#374151"
                    className="dark:fill-gray-300 font-medium"
                  >
                    {point.storeName.split(' ')[0]}
                  </text>
                  {/* Visit count */}
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2"
                    fill="white"
                    fontWeight="bold"
                  >
                    {point.visitCount}
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Coordinate info overlay */}
            <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded text-xs text-muted-foreground border">
              Lat/Lng coordinate mapping • {mapData.length} locations
            </div>
          </div>

          {/* Lead Details */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Lead Locations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mapData.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg border bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{lead.storeName}</h5>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: lead.color + '20', color: lead.color }}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Visits:</span>
                      <span>{lead.visitCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lat:</span>
                      <span>{lead.latitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lng:</span>
                      <span>{lead.longitude.toFixed(4)}</span>
                    </div>
                    {lead.lastVisit && (
                      <div className="flex justify-between">
                        <span>Last Visit:</span>
                        <span>{new Date(lead.lastVisit).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 