
import { useState, useMemo } from "react";
import { SalespersonCoverageMap } from "@/components/territories/SalespersonCoverageMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";

export default function Territory() {
  const { user } = useAuth();
  const { data: users = [] } = useUsers();
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
  useMemo(() => {
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

  // Convert date range to time filter for the map component
  const getTimeFilter = (dateRange: string) => {
    switch (dateRange) {
      case 'today': return 'daily';
      case 'week': return 'weekly';
      case 'month': return 'monthly';
      case 'year': return 'yearly';
      default: return 'all';
    }
  };

  // Get the actual salesperson ID or name to pass to the map
  const getSelectedSalespersonForMap = () => {
    if (selectedSalesperson === 'all') return undefined;
    
    // If it's a name/email, return it directly
    if (selectedSalesperson !== 'all') {
      return selectedSalesperson;
    }
    
    return undefined;
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

      {/* Map Component */}
      <SalespersonCoverageMap
        key={`${selectedSalesperson}-${selectedDateRange}`}
        selectedSalespersonId={getSelectedSalespersonForMap()}
        timeFilter={getTimeFilter(selectedDateRange) as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'}
      />
    </div>
  );
}
