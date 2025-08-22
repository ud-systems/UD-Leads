import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MapPin, Users, TrendingUp, Calendar, Target } from 'lucide-react';

interface TerritoryPoint {
  city: string;
  visitCount: number;
  leads: number;
  salespeople: string[];
  lastVisit: string | null;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export const TerritoryMap: React.FC = () => {
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Determine component title based on user role
  const componentTitle = isSalesperson ? "My Coverage Map" : "Geographic Territory Map";
  const componentDescription = isSalesperson 
    ? "Visualize your sales activity across UK territories" 
    : "Visualize sales activity across UK territories";

  // UK city coordinates (simplified for demo)
  const cityCoordinates: Record<string, { x: number; y: number }> = {
    'London': { x: 50, y: 30 },
    'Manchester': { x: 45, y: 40 },
    'Birmingham': { x: 48, y: 45 },
    'Leeds': { x: 47, y: 38 },
    'Liverpool': { x: 42, y: 42 },
    'Sheffield': { x: 46, y: 42 },
    'Edinburgh': { x: 52, y: 15 },
    'Bristol': { x: 35, y: 50 },
    'Glasgow': { x: 50, y: 18 },
    'Cardiff': { x: 32, y: 55 },
    'Newcastle': { x: 53, y: 25 },
    'Belfast': { x: 25, y: 20 },
    'Nottingham': { x: 49, y: 48 },
    'Leicester': { x: 50, y: 50 },
    'Coventry': { x: 49, y: 47 },
    'Bradford': { x: 46, y: 39 },
    'Stoke-on-Trent': { x: 47, y: 46 },
    'Wolverhampton': { x: 48, y: 49 },
    'Plymouth': { x: 30, y: 65 },
    'Southampton': { x: 40, y: 58 }
  };

  const territoryData = useMemo(() => {
    if (!leads || !visits) return [];

    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter visits by time range and salesperson
    const filteredVisits = visits.filter(visit => {
      const visitDate = new Date(visit.date);
      const meetsTimeRange = visitDate >= cutoffDate;
      const meetsSalesperson = selectedSalesperson === 'all' || visit.salesperson === selectedSalesperson;
      return meetsTimeRange && meetsSalesperson;
    });

    // Group by city
    const cityGroups = leads.reduce((acc, lead) => {
      const city = lead.city || 'Unknown';
      if (!acc[city]) {
        acc[city] = {
          leads: [],
          visits: [],
          salespeople: new Set()
        };
      }
      acc[city].leads.push(lead);
      return acc;
    }, {} as Record<string, { leads: any[]; visits: any[]; salespeople: Set<string> }>);

    // Add visits to cities
    filteredVisits.forEach(visit => {
      const lead = leads.find(l => l.id === visit.lead_id);
      if (lead && lead.city) {
        if (!cityGroups[lead.city]) {
          cityGroups[lead.city] = {
            leads: [],
            visits: [],
            salespeople: new Set()
          };
        }
        cityGroups[lead.city].visits.push(visit);
        if (visit.salesperson) {
          cityGroups[lead.city].salespeople.add(visit.salesperson);
        }
      }
    });

    // Create map points
    const points: TerritoryPoint[] = Object.entries(cityGroups)
      .filter(([city]) => cityCoordinates[city]) // Only cities with coordinates
      .map(([city, data]) => {
        const visitCount = data.visits.length;
        const leads = data.leads.length;
        const lastVisit = data.visits
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        // Calculate radius based on visit count (min 8, max 25)
        const maxVisits = Math.max(...Object.values(cityGroups).map(d => d.visits.length));
        const radius = maxVisits > 0 ? 8 + (visitCount / maxVisits) * 17 : 8;
        
        // Calculate color intensity
        const intensity = maxVisits > 0 ? (visitCount / maxVisits) : 0;
        const hue = 240 - (intensity * 240); // Blue to Red
        const color = `hsl(${hue}, 70%, 50%)`;
        
        return {
          city,
          visitCount,
          leads: leads, // Keep the interface name for compatibility
          salespeople: Array.from(data.salespeople),
          lastVisit: lastVisit ? lastVisit.date : null,
          x: cityCoordinates[city].x,
          y: cityCoordinates[city].y,
          radius,
          color
        };
      });

    return points.sort((a, b) => b.visitCount - a.visitCount);
  }, [leads, visits, selectedSalesperson, timeRange]);

  const salespersonOptions = useMemo(() => {
    const salespeople = new Set(visits.map(v => v.salesperson).filter(Boolean));
    return Array.from(salespeople).sort();
  }, [visits]);

  const totalVisits = territoryData.reduce((sum, t) => sum + t.visitCount, 0);
  const totalTerritories = territoryData.length;
  const activeTerritories = territoryData.filter(t => t.visitCount > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {componentTitle}
            </CardTitle>
            <CardDescription>
              {componentDescription}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isSalesperson && (
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Salespeople" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespeople</SelectItem>
                  {salespersonOptions.map(sp => (
                    <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-lg font-semibold">{totalVisits}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <MapPin className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Territories</p>
              <p className="text-lg font-semibold">{totalTerritories}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <Users className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-lg font-semibold">{activeTerritories}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <Calendar className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Time Range</p>
              <p className="text-lg font-semibold">{timeRange}</p>
            </div>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">UK Territory Activity</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Low</span>
              <div className="w-32 h-3 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded"></div>
              <span>High</span>
            </div>
          </div>
          
          <div className="relative w-full h-96 bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
            {/* Simplified UK outline */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* UK outline (simplified) */}
              <path
                d="M20 20 L80 20 L85 30 L80 40 L85 50 L80 60 L85 70 L80 80 L20 80 L15 70 L20 60 L15 50 L20 40 L15 30 Z"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
                className="dark:stroke-gray-700"
              />
              
              {/* Territory points */}
              {territoryData.map((point) => (
                <g key={point.city}>
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
                  />
                  {/* City label */}
                  <text
                    x={point.x}
                    y={point.y + point.radius + 8}
                    textAnchor="middle"
                    fontSize="3"
                    fill="#374151"
                    className="dark:fill-gray-300 font-medium"
                  >
                    {point.city}
                  </text>
                  {/* Visit count */}
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2.5"
                    fill="white"
                    fontWeight="bold"
                  >
                    {point.visitCount}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Territory Details */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Territory Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {territoryData.slice(0, 6).map((territory) => (
                <div
                  key={territory.city}
                  className="p-3 rounded-lg border bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{territory.city}</h5>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: territory.color + '20', color: territory.color }}
                    >
                      {territory.visitCount} visits
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{territory.leads} leads</div>
                    <div>{territory.salespeople.length} salespeople</div>
                    {territory.lastVisit && (
                      <div>Last: {new Date(territory.lastVisit).toLocaleDateString()}</div>
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
}; 