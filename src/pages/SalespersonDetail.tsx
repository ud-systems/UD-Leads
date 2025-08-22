import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  ArrowUpRight,
  Users, 
  Calendar, 
  DollarSign, 
  Target, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Building, 
  ShoppingCart, 
  Clock, 
  RefreshCw,
  MapPin,
  TrendingUp
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalespersonCoverageMap } from "@/components/territories/SalespersonCoverageMap";
import { LeadsGrowthChart } from "@/components/charts/LeadsGrowthChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalespersonDetail() {
  const { salespersonId } = useParams<{ salespersonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  const { data: territories = [], isLoading: territoriesLoading, refetch: refetchTerritories } = useTerritories();
  const { data: visits = [], isLoading: visitsLoading, refetch: refetchVisits } = useVisits();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { userRole } = useRoleAccess();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);

  // Date range filter for this salesperson's data
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  // Get the specific salesperson data
  const salesperson = useMemo(() => {
    return users.find(user => user.id === salespersonId);
  }, [users, salespersonId]);

  // Filter leads for this specific salesperson
  const salespersonLeads = useMemo(() => {
    if (!leads || !salesperson) return [];
    
    let filtered = leads.filter(lead => {
      const salespersonName = (salesperson as any).name || salesperson.email;
      return lead.salesperson === salespersonName || lead.salesperson === salesperson.email;
    });

    // Apply date range filter if set
    if (dateRange) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.updated_at);
        
        if (dateRange.from && dateRange.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return leadDate.toDateString() === dateRange.from.toDateString();
        }
        
        if (dateRange.from && !dateRange.to) {
          return leadDate >= dateRange.from;
        }
        
        if (!dateRange.from && dateRange.to) {
          return leadDate <= dateRange.to;
        }
        
        if (dateRange.from && dateRange.to) {
          return leadDate >= dateRange.from && leadDate <= dateRange.to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [leads, salesperson, dateRange]);

  // Filter visits for this specific salesperson
  const salespersonVisits = useMemo(() => {
    if (!visits || !salesperson) return [];
    
    let filtered = visits.filter(groupedVisit => {
      const salespersonName = (salesperson as any).name || salesperson.email;
      // Check both the lastVisit salesperson and the lead's salesperson
      return (groupedVisit.lastVisit.salesperson === salespersonName || 
              groupedVisit.lastVisit.salesperson === salesperson.email) ||
             (groupedVisit.lead.salesperson === salespersonName || 
              groupedVisit.lead.salesperson === salesperson.email);
    });

    // Apply date range filter if set
    if (dateRange) {
      filtered = filtered.filter(groupedVisit => {
        const visitDate = new Date(groupedVisit.lastVisit.date);
        
        if (dateRange.from && dateRange.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return visitDate.toDateString() === dateRange.from.toDateString();
        }
        
        if (dateRange.from && !dateRange.to) {
          return visitDate >= dateRange.from;
        }
        
        if (!dateRange.from && dateRange.to) {
          return visitDate <= dateRange.to;
        }
        
        if (dateRange.from && dateRange.to) {
          return visitDate >= dateRange.from && visitDate <= dateRange.to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [visits, salesperson, dateRange]);

  // Calculate dashboard stats for this salesperson
  const dashboardStats = useMemo(() => {
    const totalLeads = salespersonLeads.length;
    const convertedLeads = salespersonLeads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
    const totalVisits = salespersonVisits.length;
    const completedVisits = salespersonVisits.filter(v => v.lastVisit.status === 'completed').length;
    const visitCompletionRate = totalVisits > 0 ? ((completedVisits / totalVisits) * 100) : 0;

    return [
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        description: "Leads generated",
        icon: Building,
        trend: "up",
        trendValue: "+12%",
        color: "text-blue-600"
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate.toFixed(1)}%`,
        description: "Leads converted",
        icon: CheckCircle,
        trend: conversionRate > 15 ? "up" : "down",
        trendValue: conversionRate > 15 ? "+5%" : "-2%",
        color: "text-green-600"
      },
      {
        title: "Total Visits",
        value: totalVisits.toString(),
        description: "Visits scheduled",
        icon: Calendar,
        trend: "up",
        trendValue: "+8%",
        color: "text-purple-600"
      },
      {
        title: "Visit Completion",
        value: `${visitCompletionRate.toFixed(1)}%`,
        description: "Visits completed",
        icon: Activity,
        trend: visitCompletionRate > 80 ? "up" : "down",
        trendValue: visitCompletionRate > 80 ? "+3%" : "-1%",
        color: "text-orange-600"
      }
    ];
  }, [salespersonLeads, salespersonVisits]);

  // Refresh function
  const handleRefresh = async () => {
    console.log('Refreshing salesperson data...');
    await Promise.all([
      refetchLeads(),
      refetchVisits(),
      refetchUsers(),
      refetchTerritories()
    ]);
    console.log('Salesperson data refreshed');
  };

  // Handle date range change
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    setDateRange(range);
  };

  // Show loading state
  if (leadsLoading || territoriesLoading || visitsLoading || usersLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Loading salesperson data...</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Show error if salesperson not found
  if (!salesperson) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Salesperson Not Found</h1>
            <p className="text-muted-foreground">The requested salesperson could not be found.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const salespersonName = (salesperson as any).name || salesperson.email;



  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={(salesperson as any).avatar_url} alt={salespersonName} />
            <AvatarFallback className="text-lg">
              {salespersonName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{salespersonName}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Salesperson Performance Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={leadsLoading || visitsLoading || usersLoading || territoriesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(leadsLoading || visitsLoading || usersLoading || territoriesLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription>
            Filter data for this salesperson by date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={!dateRange ? "default" : "outline"} 
              size="sm"
              onClick={() => handleDateRangeChange(undefined)}
            >
              All Time
            </Button>
            <Button 
              variant={dateRange && dateRange.from.toDateString() === dateRange.to.toDateString() ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                const today = new Date();
                handleDateRangeChange({ from: today, to: today });
              }}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                handleDateRangeChange({ from: lastWeek, to: today });
              }}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                handleDateRangeChange({ from: lastMonth, to: today });
              }}
            >
              Last 30 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Coverage Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Territory Coverage
          </CardTitle>
          <CardDescription>
            Visual representation of {salespersonName}'s territory and lead distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalespersonCoverageMap 
            salespersonName={salespersonName}
            leads={salespersonLeads}
            territories={territories}
          />
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <LeadsGrowthChart
        selectedSalesperson={salespersonName}
        dateRange={dateRange}
        timeGranularity="day"
      />

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Leads ({salespersonLeads.length})
          </CardTitle>
          <CardDescription>
            All leads managed by {salespersonName}
          </CardDescription>
        </CardHeader>
                <CardContent>
          {salespersonLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No leads found for this salesperson</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {salespersonLeads.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{lead.store_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {lead.status || 'No Status'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>{lead.company_name}</p>
                        <p>{lead.contact_person} • {lead.phone_number}</p>
                        <p>{territories.find(t => t.id === lead.territory_id)?.city || 'Unknown'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="hidden sm:table-cell">Store Name</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Store Type</TableHead>
                      <TableHead className="hidden md:table-cell">Territory</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salespersonLeads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        <TableCell className="hidden sm:table-cell">
                          <div className="font-medium">{lead.store_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {lead.company_name}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="font-medium">{lead.contact_person}</div>
                          <div className="text-sm text-muted-foreground">
                            {lead.phone_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {lead.status || 'No Status'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {lead.store_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {territories.find(t => t.id === lead.territory_id)?.city || 'Unknown'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/leads/${lead.id}`);
                            }}
                            className="h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
