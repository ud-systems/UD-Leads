import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { useUsers } from '@/hooks/useUsers';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MapPin, Users, TrendingUp, Calendar } from 'lucide-react';

interface TerritoryData {
  city: string;
  visitCount: number;
  uniqueSalespeople: number;
  leads: number;
  lastVisitDate: string | null;
  salespeople: string[];
  color: string;
}

export const TerritoryHeatmap: React.FC = () => {
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();
  const { data: users = [] } = useUsers();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Determine component title based on user role
  const componentTitle = isSalesperson ? "My Activity Heatmap" : "Activity Heatmap";
  const componentDescription = isSalesperson 
    ? "Visualize your sales activity intensity across territories" 
    : "Visualize sales activity intensity across territories";

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

    // Group leads by city
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

    // Calculate heatmap data
    const territories: TerritoryData[] = Object.entries(cityGroups).map(([city, data]) => {
      const visitCount = data.visits.length;
      const uniqueSalespeople = data.salespeople.size;
      const leads = data.leads.length;
      
      // Find last visit date
      const lastVisit = data.visits
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastVisitDate = lastVisit ? lastVisit.date : null;

      // Calculate color intensity based on visit density
      const maxVisits = Math.max(...Object.values(cityGroups).map(d => d.visits.length));
      const intensity = maxVisits > 0 ? (visitCount / maxVisits) : 0;
      
      // Generate color from blue (low) to red (high)
      const hue = 240 - (intensity * 240); // Blue (240) to Red (0)
      const saturation = 70;
      const lightness = 50 + (intensity * 20); // 50% to 70%
      
      return {
        city,
        visitCount,
        uniqueSalespeople,
        leads: leads, // Keep the interface name for compatibility
        lastVisitDate,
        salespeople: Array.from(data.salespeople),
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`
      };
    });

    return territories.sort((a, b) => b.visitCount - a.visitCount);
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
              <MapPin className="h-5 w-5" />
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

        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Territory Activity</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Low</span>
              <div className="w-32 h-3 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded"></div>
              <span>High</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {territoryData.map((territory) => (
              <div
                key={territory.city}
                className="relative p-4 rounded-lg border transition-all hover:shadow-md"
                style={{
                  backgroundColor: territory.color + '20',
                  borderColor: territory.color + '40'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{territory.city}</h4>
                    <p className="text-sm text-muted-foreground">
                      {territory.leads} leads
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: territory.color + '30', color: territory.color }}
                  >
                    {territory.visitCount} visits
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{territory.uniqueSalespeople} salespeople</span>
                  </div>
                  
                  {territory.lastVisitDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Last visit: {new Date(territory.lastVisitDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {territory.salespeople.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Active:</span>
                      <div className="flex flex-wrap gap-1">
                        {territory.salespeople.slice(0, 2).map((sp, index) => (
                          <Badge key={sp} variant="outline" className="text-xs">
                            {sp}
                          </Badge>
                        ))}
                        {territory.salespeople.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{territory.salespeople.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {territoryData.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Territory Data</h3>
              <p className="text-muted-foreground">
                No visits found for the selected criteria. Try adjusting the filters.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 