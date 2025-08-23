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
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface SalespersonDetailMapProps {
  salespersonName: string;
  leads: any[];
  territories: any[];
}

// Function to convert lat/lng to SVG coordinates (simplified projection)
function latLngToSVG(lat: number, lng: number): { x: number; y: number } {
  // Simple linear mapping for UK coordinates
  // UK bounds approximately: lat 49.9-60.8, lng -8.6-1.8
  const latMin = 49.9, latMax = 60.8;
  const lngMin = -8.6, lngMax = 1.8;
  
  // Map to 0-100 SVG coordinates
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 80 + 10; // 10-90 range
  const y = 90 - ((lat - latMin) / (latMax - latMin)) * 80; // 10-90 range (inverted Y)
  
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

export function SalespersonDetailMap({ 
  salespersonName, 
  leads = [], 
  territories = [] 
}: SalespersonDetailMapProps) {
  
  // Convert leads to map points with coordinate mapping
  const mapData = useMemo(() => {
    if (!leads || !Array.isArray(leads)) return [];

    const points: LeadPoint[] = leads
      .filter(lead => lead.latitude && lead.longitude) // Only leads with coordinates
      .map(lead => {
        const svgCoords = latLngToSVG(parseFloat(lead.latitude), parseFloat(lead.longitude));
        
        // Determine color based on status
        let color = '#6b7280'; // gray default
        switch (lead.status?.toLowerCase()) {
          case 'active':
          case 'new prospect - not registered':
            color = '#10b981'; // green
            break;
          case 'converted':
            color = '#8b5cf6'; // purple
            break;
          case 'pending':
          case 'follow up':
            color = '#f59e0b'; // orange
            break;
          case 'qualified':
            color = '#06b6d4'; // cyan
            break;
          case 'lost':
          case 'unqualified':
            color = '#ef4444'; // red
            break;
          case 'inactive':
          case 'on hold':
            color = '#6b7280'; // gray
            break;
        }

        return {
          id: lead.id,
          storeName: lead.store_name || 'Unknown Store',
          latitude: parseFloat(lead.latitude),
          longitude: parseFloat(lead.longitude),
          status: lead.status || 'unknown',
          x: svgCoords.x,
          y: svgCoords.y,
          radius: 6, // Base radius
          color
        };
      });

    return points;
  }, [leads]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsWithCoords = mapData.length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      leadsWithCoords,
      convertedLeads,
      conversionRate
    };
  }, [leads, mapData]);

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
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Building className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-lg font-semibold">{stats.totalLeads}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <MapPin className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Mapped Leads</p>
            <p className="text-lg font-semibold">{stats.leadsWithCoords}</p>
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
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className="text-lg font-semibold">{stats.conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{salespersonName}'s Territory</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Converted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Lost</span>
            </div>
          </div>
        </div>
        
        <div className="relative w-full h-96 bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          {/* Map visualization with coordinate-based dots */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Map background */}
            <rect width="100" height="100" fill="#f8fafc" className="dark:fill-gray-800" />
            
            {/* UK outline (simplified) */}
            <path
              d="M15 15 L85 15 L90 25 L85 35 L90 45 L85 55 L90 65 L85 75 L85 85 L15 85 L10 75 L15 65 L10 55 L15 45 L10 35 L15 25 Z"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.5"
              className="dark:stroke-gray-700"
            />
            
            {/* Grid lines for reference */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.1" className="dark:stroke-gray-700" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Lead points based on actual coordinates */}
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
                {/* Store name (on hover or simplified) */}
                <title>
                  {point.storeName} • {point.status} • Lat: {point.latitude.toFixed(4)}, Lng: {point.longitude.toFixed(4)}
                </title>
              </g>
            ))}
          </svg>
          
          {/* Coordinate info overlay */}
          <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded text-xs text-muted-foreground border">
            {mapData.length} leads mapped from coordinates
          </div>
          
          {/* Legend overlay */}
          <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-2 rounded text-xs border">
            <div className="text-muted-foreground mb-1">Territory: {salespersonName}</div>
            <div className="text-muted-foreground">Conversion: {stats.conversionRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Lead Details */}
        {mapData.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Mapped Lead Locations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {mapData.slice(0, 12).map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg border bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{lead.storeName}</h5>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: lead.color + '20', color: lead.color }}
                      className="text-xs"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Lat:</span>
                      <span>{lead.latitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lng:</span>
                      <span>{lead.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {mapData.length > 12 && (
                <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    +{mapData.length - 12} more leads
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
