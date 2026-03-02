
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { useStatusColors, getStatusColor } from "@/hooks/useStatusColors";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MapPin, Users, Building, Calendar, Target, ArrowUpRight, Plus } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export default function Territory() {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { user } = useAuth();
  const { data: users = [] } = useUsers();
  const { data: leads = [] } = useLeads();
  const { data: territories = [] } = useTerritories();
  const { data: statusColors = [] } = useStatusColors();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();
  
  // Filter states
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get salespeople for filter dropdown
  const salespeople = useMemo(() => {
    if (isAdmin) {
      // Admins can see all salespeople and managers
      return users
        .filter((user: any) => {
          const role = user.role;
          return role === 'salesperson' || role === 'manager';
        })
        .map((user: any) => ({ 
          id: user.id, 
          name: user.name || user.email 
        }));
    } else if (isManager && user) {
      // Managers can see themselves and their team members
      return users
        .filter((u: any) => {
          const userRole = u.role;
          const userId = u.id;
          
          // Include themselves (manager)
          if (userId === user.id && userRole === 'manager') {
            return true;
          }
          
          // Include their team members (salespeople assigned to them)
          if (userRole === 'salesperson' && u.manager_id === user.id) {
            return true;
          }
          
          return false;
        })
        .map((u: any) => ({ 
          id: u.id, 
          name: u.name || u.email 
        }));
    } else if (isSalesperson) {
      // Salespeople can only see themselves
      return users
        .filter((u: any) => u.id === user?.id)
        .map((u: any) => ({ 
          id: u.id, 
          name: u.name || u.email 
        }));
    }
    
    return [];
  }, [users, isAdmin, isManager, isSalesperson, user]);

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

      {/* Filters - same mobile UX as Leads, Visits, Scheduled Followups */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 w-full">
            {/* Filter controls - on mobile hidden until "Show Filters" is toggled */}
            <div className={cn(
              "flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3",
              isMobile && !showFilters ? "hidden" : "flex"
            )}>
              {/* Salesperson Filter - Hidden for salespeople */}
              {!isSalesperson && (
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger className="w-full sm:w-48 h-10">
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
              )}

              {/* Date Range Filter */}
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-full sm:w-32 h-10">
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

              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap gap-2">
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

            {/* Show/Hide Filters Button - Only on Mobile (same style as other pages) */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-black text-white hover:bg-gray-700 hover:text-white border-0"
              >
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
                <Plus className="h-4 w-4 shrink-0" />
              </Button>
            )}
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
