import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Building, Calendar, Target, ArrowUpRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useStatusColors, getStatusColor } from '@/hooks/useStatusColors';

// Create custom colored markers based on lead status from database
const createColoredMarker = (status: string, statusColors: any[]) => {
  const statusColor = getStatusColor(statusColors, status);
  const color = statusColor.color_code;

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

interface SalespersonDetailMapProps {
  salespersonName: string;
  leads: any[];
  territories: any[];
}

export function SalespersonDetailMap({ 
  salespersonName, 
  leads = [], 
  territories = [] 
}: SalespersonDetailMapProps) {
  const navigate = useNavigate();
  const { data: statusColors = [] } = useStatusColors();
  
  // Get leads with valid coordinates for the map
  const mapLeads = useMemo(() => {
    return leads.filter(lead => 
      lead.latitude && 
      lead.longitude && 
      !isNaN(parseFloat(lead.latitude)) && 
      !isNaN(parseFloat(lead.longitude))
    );
  }, [leads]);

  // Calculate map center based on leads
  const mapCenter = useMemo(() => {
    if (mapLeads.length === 0) {
      return [54.0, -2.0]; // Default UK center
    }

    const totalLat = mapLeads.reduce((sum, lead) => sum + parseFloat(lead.latitude), 0);
    const totalLng = mapLeads.reduce((sum, lead) => sum + parseFloat(lead.longitude), 0);
    
    return [totalLat / mapLeads.length, totalLng / mapLeads.length];
  }, [mapLeads]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsWithCoords = mapLeads.length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      leadsWithCoords,
      convertedLeads,
      conversionRate
    };
  }, [leads, mapLeads]);

  if (!leads || leads.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">No lead data available</p>
          <p className="text-xs text-muted-foreground">
            {salespersonName} has no leads assigned yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Mapped Leads</p>
                <p className="text-2xl font-bold">{stats.leadsWithCoords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Converted</p>
                <p className="text-2xl font-bold">{stats.convertedLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {salespersonName}'s Territory Map
          </CardTitle>
          <CardDescription>
            Showing {mapLeads.length} leads for {salespersonName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            <MapContainer
              center={mapCenter as [number, number]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mapLeads.map((lead) => (
                <Marker
                  key={lead.id}
                  position={[parseFloat(lead.latitude), parseFloat(lead.longitude)]}
                  icon={createColoredMarker(lead.status, statusColors)}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{lead.store_name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="h-6 w-6 p-0 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-xs"><strong>Status:</strong></span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              backgroundColor: getStatusColor(statusColors, lead.status).background_color,
                              color: getStatusColor(statusColors, lead.status).text_color,
                              borderColor: getStatusColor(statusColors, lead.status).color_code
                            }}
                          >
                            {lead.status || 'No Status'}
                          </Badge>
                        </div>
                        <p><strong>Store Type:</strong> {lead.store_type}</p>
                        <p><strong>Territory:</strong> {territories.find(t => t.id === lead.territory_id)?.city || 'Unknown'}</p>
                        <p><strong>Salesperson:</strong> {lead.salesperson}</p>
                        <p><strong>Created:</strong> {new Date(lead.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
