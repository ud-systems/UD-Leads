
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Users, Building, Calendar, Target, Filter } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Territory() {
  const { user } = useAuth();
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: territories = [] } = useTerritories();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();
  
  // Filter states
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  // Get salespeople for filter dropdown
  const salespeople = useMemo(() => {
    return users
      .filter((user: any) => user.role === 'salesperson')
      .map((user: any) => ({ 
        id: user.id, 
        name: user.name || user.email 
      }));
  }, [users]);

  // Auto-select current user if they're a salesperson
  useEffect(() => {
    if (isSalesperson && user) {
      const currentUser = users.find((u: any) => u.id === user.id);
      if (currentUser) {
        setSelectedSalesperson(currentUser.name || currentUser.email || 'all');
      }
    }
  }, [isSalesperson, user, users]);

  // Determine page title based on user role
  const pageTitle = isSalesperson ? "My Territory Coverage" : "Territory Coverage Map";
  const pageDescription = isSalesperson 
    ? "Visualize your lead locations and visit activity across your territory" 
    : "Visualize salesperson lead locations and visit activity across territories";

  // Filter leads based on selected salesperson and date range
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Filter by salesperson
    if (selectedSalesperson !== 'all') {
      filtered = filtered.filter(lead => 
        lead.salesperson === selectedSalesperson
      );
    }

    // Filter by date range
    if (selectedDateRange !== 'all') {
      const today = new Date();
      let startDate: Date;
      
      switch (selectedDateRange) {
        case 'today':
          startDate = new Date(today);
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      if (selectedDateRange !== 'all') {
        filtered = filtered.filter(lead => {
          const leadDate = new Date(lead.created_at || lead.updated_at);
          return leadDate >= startDate;
        });
      }
    }

    return filtered;
  }, [leads, selectedSalesperson, selectedDateRange]);

  // Get leads with valid coordinates for the map
  const mapLeads = useMemo(() => {
    return filteredLeads.filter(lead => 
      lead.latitude && 
      lead.longitude && 
      !isNaN(parseFloat(lead.latitude)) && 
      !isNaN(parseFloat(lead.longitude))
    );
  }, [filteredLeads]);

  // Calculate map center based on leads
  const mapCenter = useMemo(() => {
    if (mapLeads.length === 0) {
      return [54.0, -2.0]; // Default UK center
    }

    const totalLat = mapLeads.reduce((sum, lead) => sum + parseFloat(lead.latitude), 0);
    const totalLng = mapLeads.reduce((sum, lead) => sum + parseFloat(lead.longitude), 0);
    
    return [totalLat / mapLeads.length, totalLng / mapLeads.length];
  }, [mapLeads]);

  // Get the selected salesperson name for display
  const getSelectedSalespersonName = () => {
    if (selectedSalesperson === 'all') return 'All Salespeople';
    return selectedSalesperson;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {pageTitle}
        </h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Map Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Salesperson Filter - Hidden for salespeople */}
            {!isSalesperson && (
              <div className="flex items-center gap-2">
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Salespeople</SelectItem>
                    {salespeople.map((person) => (
                      <SelectItem key={person.id} value={person.name}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedDateRange === 'today' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDateRange('today')}
              >
                Today
              </Button>
              <Button
                variant={selectedDateRange === 'week' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDateRange('week')}
              >
                Week
              </Button>
              <Button
                variant={selectedDateRange === 'month' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDateRange('month')}
              >
                Month
              </Button>
              <Button
                variant={selectedDateRange === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDateRange('all')}
              >
                All Time
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Territory Map
          </CardTitle>
          <CardDescription>
            Showing {mapLeads.length} leads for {getSelectedSalespersonName()}
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
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-sm mb-2">{lead.store_name}</h3>
                      <div className="space-y-1 text-xs">
                        <p><strong>Contact:</strong> {lead.contact_person}</p>
                        <p><strong>Company:</strong> {lead.company_name}</p>
                        <p><strong>Phone:</strong> {lead.phone_number}</p>
                        <p><strong>Email:</strong> {lead.email}</p>
                        <p><strong>Status:</strong> 
                          <Badge variant="outline" className="ml-1 text-xs">
                            {lead.status || 'No Status'}
                          </Badge>
                        </p>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold">{filteredLeads.length}</p>
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
                <p className="text-2xl font-bold">{mapLeads.length}</p>
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
                <p className="text-2xl font-bold">
                  {filteredLeads.filter(l => l.status === 'converted').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {filteredLeads.length > 0 
                    ? ((filteredLeads.filter(l => l.status === 'converted').length / filteredLeads.length) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
