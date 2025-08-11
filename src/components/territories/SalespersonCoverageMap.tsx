import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Target } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess } from '@/hooks/useRoleAccess';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeadLocation {
  id: string;
  store_name: string;
  latitude: number;
  longitude: number;
  salesperson: string;
  visit_count: number;
  last_visit: string;
  status: string;
  company_name?: string;
  contact_person?: string;
}

interface SalespersonCoverageMapProps {
  selectedSalespersonId?: string;
  timeFilter?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
}

export function SalespersonCoverageMap({ 
  selectedSalespersonId, 
  timeFilter = 'all' 
}: SalespersonCoverageMapProps) {
  const { user } = useAuth();
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();
  const { data: users = [] } = useUsers();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();

  // Determine component title based on user role
  const componentTitle = isSalesperson ? "My Coverage Map" : "Salesperson Coverage Map";
  const componentDescription = isSalesperson 
    ? "Visualize your lead locations and visit activity" 
    : "Visualize salesperson lead locations and visit activity";

  // Get salespersons (users with role 'salesperson')
  const salespersons = useMemo(() => {
    return users.filter((user: any) => user.role === 'salesperson');
  }, [users]);

  // Process lead locations with visit data
  const leadLocations = useMemo(() => {
    if (!leads || !visits) return [];

    const today = new Date();
    const timeFilterDate = new Date();

    // Calculate date range based on filter
    switch (timeFilter) {
      case 'daily':
        // Today only
        timeFilterDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        // Last 7 days
        timeFilterDate.setDate(today.getDate() - 7);
        timeFilterDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // Last 30 days
        timeFilterDate.setDate(today.getDate() - 30);
        timeFilterDate.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        // Last 365 days
        timeFilterDate.setDate(today.getDate() - 365);
        timeFilterDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        // All time - go back to 2020
        timeFilterDate.setFullYear(2020, 0, 1);
        timeFilterDate.setHours(0, 0, 0, 0);
        break;
    }

    return leads
      .filter((lead: any) => {
        // Filter by selected salesperson
        if (selectedSalespersonId && selectedSalespersonId !== 'all') {
          // Find the user by name or email
          const targetUser = users.find((u: any) => 
            u.name === selectedSalespersonId || u.email === selectedSalespersonId
          );
          if (targetUser && lead.salesperson !== targetUser.name && lead.salesperson !== targetUser.email) {
            return false;
          }
        }
        // Filter by coordinates
        return lead.latitude && lead.longitude;
      })
      .map((lead: any) => {
        // Count visits for this lead within the time filter
        const leadVisits = visits.filter((visit: any) => {
          const visitDate = new Date(visit.lastModified);
          return visit.lead.id === lead.id && visitDate >= timeFilterDate;
        });

        const visitCount = leadVisits.length;
        const lastVisit = leadVisits.length > 0 
          ? new Date(Math.max(...leadVisits.map((v: any) => new Date(v.lastModified).getTime())))
          : null;

        return {
          id: lead.id,
          store_name: lead.store_name || 'Unknown Store',
          latitude: lead.latitude,
          longitude: lead.longitude,
          salesperson: lead.salesperson || 'Unassigned',
          visit_count: visitCount,
          last_visit: lastVisit?.toISOString() || '',
          status: lead.status || 'Unknown',
          company_name: lead.company_name,
          contact_person: lead.contact_person,
        } as LeadLocation;
      })
      .filter((lead: LeadLocation) => lead.latitude && lead.longitude);
  }, [leads, visits, selectedSalespersonId, timeFilter, users]);

  // Calculate map center based on lead locations
  const mapCenter = useMemo(() => {
    if (leadLocations.length === 0) {
      return [54.0, -2.0]; // Default UK center
    }

    const lats = leadLocations.map(l => l.latitude);
    const lngs = leadLocations.map(l => l.longitude);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return [centerLat, centerLng];
  }, [leadLocations]);

  // Get color based on lead status
  const getMarkerColor = (status: string) => {
    if (status === 'Active') return '#10b981'; // Green for Active
    if (status === 'Prospect') return '#3b82f6'; // Blue for Prospect
    return '#9ca3af'; // Light gray for unknown status
  };

  // Create custom icon based on lead status
  const createCustomIcon = (status: string, visitCount: number) => {
    const color = getMarkerColor(status);
    // Make markers with visits larger and more prominent
    const baseSize = visitCount === 0 ? 12 : 20;
    const size = visitCount === 0 ? baseSize : Math.min(baseSize + visitCount * 3, 50);

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3)${visitCount > 0 ? ', 0 0 20px ' + color + '40' : ''};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(10, size * 0.4)}px;
          ${visitCount > 0 ? 'animation: pulse 2s infinite;' : ''}
          position: relative;
        ">
          ${visitCount > 0 ? visitCount : ''}
          ${visitCount > 0 ? `
            <div style="
              position: absolute;
              top: -5px;
              right: -5px;
              width: 8px;
              height: 8px;
              background-color: #10b981;
              border-radius: 50%;
              border: 2px solid white;
            "></div>
          ` : ''}
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {componentTitle}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{componentDescription}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Map Container */}
          <div className="h-[500px] sm:h-[600px] w-full rounded-lg border overflow-hidden">
            <MapContainer
              center={mapCenter as [number, number]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {leadLocations.map((lead) => (
                <Marker
                  key={lead.id}
                  position={[lead.latitude, lead.longitude]}
                  icon={createCustomIcon(lead.status, lead.visit_count)}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <h3 className="font-semibold text-lg">{lead.store_name}</h3>
                      {lead.company_name && (
                        <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                      )}
                      {lead.contact_person && (
                        <p className="text-sm">Contact: {lead.contact_person}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lead.status}</Badge>
                        <Badge variant={lead.visit_count > 0 ? "default" : "secondary"}>
                          <Target className="h-3 w-3 mr-1" />
                          {lead.visit_count} {lead.visit_count === 1 ? 'visit' : 'visits'}
                        </Badge>
                      </div>
                      {lead.visit_count > 0 && lead.last_visit && (
                        <div className="text-xs text-muted-foreground">
                          <p>Last visit: {new Date(lead.last_visit).toLocaleDateString()}</p>
                          <p>Salesperson: {lead.salesperson}</p>
                        </div>
                      )}
                      {lead.visit_count === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No visits recorded yet
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{leadLocations.length}</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {leadLocations.reduce((sum, lead) => sum + lead.visit_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Visits</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {leadLocations.filter(lead => lead.visit_count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Visited Leads</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {selectedSalespersonId === 'all' || !selectedSalespersonId ? salespersons.length : '1'}
              </div>
              <div className="text-sm text-muted-foreground">Salespersons</div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-4 justify-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
              <span className="text-sm font-medium">Active Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
              <span className="text-sm font-medium">Prospect Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white shadow-sm"></div>
              <span className="text-sm font-medium">Unknown Status</span>
            </div>
          </div>
          
          {/* Filter Debug Info */}
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            <div>Filter: {selectedSalespersonId || 'All'} | Time: {timeFilter}</div>
            <div>Map Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 