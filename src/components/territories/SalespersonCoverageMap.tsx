import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building, Calendar } from "lucide-react";

interface SalespersonCoverageMapProps {
  salespersonName: string;
  leads: any[];
  territories: any[];
}

export function SalespersonCoverageMap({ 
  salespersonName, 
  leads, 
  territories 
}: SalespersonCoverageMapProps) {
  
  // Group leads by territory
  const territoryStats = useMemo(() => {
    const stats: Record<string, { 
      territory: any; 
      leadCount: number; 
      convertedCount: number; 
      totalVisits: number;
      completedVisits: number;
    }> = {};

    leads.forEach(lead => {
      const territoryId = lead.territory_id;
      if (!territoryId) return;

      const territory = territories.find(t => t.id === territoryId);
      if (!territory) return;

      if (!stats[territoryId]) {
        stats[territoryId] = {
          territory,
          leadCount: 0,
          convertedCount: 0,
          totalVisits: 0,
          completedVisits: 0
        };
      }

      stats[territoryId].leadCount++;
      if (lead.status === 'converted') {
        stats[territoryId].convertedCount++;
      }
    });

    return Object.values(stats);
  }, [leads, territories]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
    const activeTerritories = territoryStats.length;

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      activeTerritories
    };
  }, [leads, territoryStats]);

  if (territoryStats.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">No territory data available</p>
          <p className="text-xs text-muted-foreground">
            {salespersonName} hasn't been assigned to any territories yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold">{overallStats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold">{overallStats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Active Territories</p>
                <p className="text-2xl font-bold">{overallStats.activeTerritories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Avg Leads/Territory</p>
                <p className="text-2xl font-bold">
                  {overallStats.activeTerritories > 0 
                    ? (overallStats.totalLeads / overallStats.activeTerritories).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territory Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Territory Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {territoryStats.map((stat) => {
            const conversionRate = stat.leadCount > 0 
              ? ((stat.convertedCount / stat.leadCount) * 100) 
              : 0;

            return (
              <Card key={stat.territory.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {stat.territory.city}
                  </CardTitle>
                  <CardDescription>
                    {stat.territory.region && `${stat.territory.region}, `}
                    {stat.territory.country || 'Unknown Region'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Leads:</span>
                    <Badge variant="secondary">{stat.leadCount}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Converted:</span>
                    <Badge variant="outline" className="text-green-600">
                      {stat.convertedCount}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                    <Badge 
                      variant={conversionRate > 15 ? "default" : "secondary"}
                      className={conversionRate > 15 ? "bg-green-100 text-green-800" : ""}
                    >
                      {conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Performance:</span>
                      <div className="flex gap-1">
                        {conversionRate > 20 && <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Excellent</Badge>}
                        {conversionRate > 10 && conversionRate <= 20 && <Badge variant="secondary" className="text-xs">Good</Badge>}
                        {conversionRate <= 10 && <Badge variant="outline" className="text-xs">Needs Improvement</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Territory Map Visualization */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Territory Distribution</h3>
        <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-sm font-medium mb-2">Territory Map Visualization</p>
            <p className="text-xs text-muted-foreground">
              Interactive map showing {salespersonName}'s territory coverage
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {territoryStats.length} territories • {overallStats.totalLeads} total leads
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 