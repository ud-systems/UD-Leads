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
import { SalespersonDetailMap } from "@/components/territories/SalespersonDetailMap";
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

  // Date range filter for this salesperson's data - default to current week like Performance page
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
    from: startOfWeek,
    to: today
  });

  // Get the specific salesperson data
  const salesperson = useMemo(() => {
    return users.find(user => user.id === salespersonId);
  }, [users, salespersonId]);

  // Determine if the viewed user is a manager or salesperson
  const isViewedUserManager = (salesperson as any)?.role === 'manager';
  const isViewedUserSalesperson = (salesperson as any)?.role === 'salesperson';

  // Filter leads for this specific user (manager or salesperson)
  const salespersonLeads = useMemo(() => {
    if (!leads || !salesperson) return [];
    
    let filtered = leads.filter(lead => {
      const userName = (salesperson as any).name || salesperson.email;
      
      if (isViewedUserManager) {
        // For managers, show BOTH their historical leads AND team leads
        return lead.salesperson === userName || lead.salesperson === salesperson.email || lead.manager_id === salesperson.id;
      } else {
        // For salespeople, show only their own leads
        return lead.salesperson === userName || lead.salesperson === salesperson.email;
      }
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
  }, [leads, salesperson, dateRange, isViewedUserManager]);

  // Filter visits for this specific user (manager or salesperson)
  const salespersonVisits = useMemo(() => {
    if (!visits || !salesperson) return [];
    
    let filtered = visits.filter(groupedVisit => {
      const userName = (salesperson as any).name || salesperson.email;
      
      if (isViewedUserManager) {
        // For managers, show BOTH their historical visits AND team visits
        return (groupedVisit.lastVisit.salesperson === userName || 
                groupedVisit.lastVisit.salesperson === salesperson.email ||
                groupedVisit.lastVisit.manager_id === salesperson.id) ||
               (groupedVisit.lead.salesperson === userName || 
                groupedVisit.lead.salesperson === salesperson.email ||
                groupedVisit.lead.manager_id === salesperson.id);
      } else {
        // For salespeople, show only their own visits
        return (groupedVisit.lastVisit.salesperson === userName || 
              groupedVisit.lastVisit.salesperson === salesperson.email) ||
               (groupedVisit.lead.salesperson === userName || 
              groupedVisit.lead.salesperson === salesperson.email);
      }
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
  }, [visits, salesperson, dateRange, isViewedUserManager]);

  // Calculate dashboard stats for this salesperson
  const dashboardStats = useMemo(() => {
    const totalLeads = salespersonLeads.length;
    const convertedLeads = salespersonLeads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
    // Calculate total visit records by filtering individual visits by date range (like Performance page)
    let totalVisitRecords = 0;
    const uniqueLeadsVisited = new Set();
    
    salespersonVisits.forEach(visitGroup => {
      visitGroup.allVisits.forEach(visit => {
        if (!dateRange) {
          totalVisitRecords++;
          uniqueLeadsVisited.add(visitGroup.leadId);
          return;
        }
        
        const visitDate = new Date(visit.date);
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
        const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
        
        if (visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly) {
          totalVisitRecords++;
          uniqueLeadsVisited.add(visitGroup.leadId);
        }
      });
    });
    
    const totalVisits = uniqueLeadsVisited.size; // Unique leads visited within date range
    // Calculate completed visits within date range
    const completedVisits = salespersonVisits.reduce((total, visitGroup) => {
      if (!dateRange) {
        return total + visitGroup.allVisits.filter(visit => visit.status === 'completed').length;
      }
      const matchingVisits = visitGroup.allVisits.filter(visit => {
        const visitDate = new Date(visit.date);
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
        const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
        return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly && visit.status === 'completed';
      });
      return total + matchingVisits.length;
    }, 0);
    
    const visitCompletionRate = totalVisitRecords > 0 ? ((completedVisits / totalVisitRecords) * 100) : 0;
    
    // Calculate revisits (total visits minus unique leads visited)
    const revisits = totalVisitRecords - totalVisits;

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
        title: "Leads Visited",
        value: totalVisits.toString(),
        description: "Unique leads visited",
        icon: Calendar,
        trend: "up",
        trendValue: "+8%",
        color: "text-purple-600"
      },
      {
        title: "Revisits",
        value: revisits.toString(),
        description: "Additional visits to existing leads",
        icon: RefreshCw,
        trend: revisits > 0 ? "up" : "neutral",
        trendValue: revisits > 0 ? "+8%" : "0%",
        color: "text-amber-600"
      },
      {
        title: "Total Visit Records",
        value: totalVisitRecords.toString(),
        description: "All visits including revisits",
        icon: Activity,
        trend: "up",
        trendValue: "+12%",
        color: "text-indigo-600"
      },
      {
        title: "Visit Completion",
        value: `${visitCompletionRate.toFixed(1)}%`,
        description: "Leads with completed visits",
        icon: CheckCircle,
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
            <p className="text-sm sm:text-base text-muted-foreground">
              {isViewedUserManager ? 'Manager Performance Overview' : 'Salesperson Performance Overview'}
            </p>
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
              variant={dateRange && dateRange.from.getDay() === 0 && dateRange.to.toDateString() === today.toDateString() ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                handleDateRangeChange({ from: startOfWeek, to: today });
              }}
            >
              This Week
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
            {isViewedUserManager && ' (including team leads)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalespersonDetailMap 
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

      {/* Visit Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Visit Records ({salespersonVisits.reduce((total, visitGroup) => {
              if (!dateRange) {
                return total + visitGroup.allVisits.length;
              }
              const matchingVisits = visitGroup.allVisits.filter(visit => {
                const visitDate = new Date(visit.date);
                const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
                const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
                const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
                return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
              });
              return total + matchingVisits.length;
            }, 0)})
          </CardTitle>
          <CardDescription>
            {isViewedUserManager 
              ? `All visit records for leads managed by ${salespersonName} (including team visits)`
              : `All visit records for leads managed by ${salespersonName}`
            }
          </CardDescription>
        </CardHeader>
                <CardContent>
          {salespersonVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No visit records found for this salesperson</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {salespersonVisits.flatMap((visitGroup, groupIndex) => 
                  visitGroup.allVisits
                    .filter(visit => {
                      if (!dateRange) return true;
                      const visitDate = new Date(visit.date);
                      const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
                      const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
                      const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
                      return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
                    })
                    .map((visit, visitIndex) => (
                    <Card 
                      key={`${visitGroup.leadId}-${visit.id || visitIndex}`} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/leads/${visitGroup.leadId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{visitGroup.lead.store_name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {visit.status || 'No Status'}
                            </Badge>
                            {visitGroup.visitCount > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                Visit #{visitIndex + 1}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{visitGroup.lead.company_name}</p>
                          <p>{visitGroup.lead.contact_person} • {visitGroup.lead.phone_number}</p>
                          <p>{territories.find(t => t.id === visitGroup.lead.territory_id)?.city || 'Unknown'}</p>
                          <p className="font-medium">Visit Date: {new Date(visit.date).toLocaleDateString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="hidden sm:table-cell">Store Name</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Visit Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Store Type</TableHead>
                      <TableHead className="hidden md:table-cell">Territory</TableHead>
                      <TableHead className="hidden lg:table-cell">Visit #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salespersonVisits.flatMap((visitGroup, groupIndex) => 
                      visitGroup.allVisits
                        .filter(visit => {
                          if (!dateRange) return true;
                          const visitDate = new Date(visit.date);
                          const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
                          const startDateOnly = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
                          const endDateOnly = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
                          return visitDateOnly >= startDateOnly && visitDateOnly <= endDateOnly;
                        })
                        .map((visit, visitIndex) => (
                        <TableRow
                          key={`${visitGroup.leadId}-${visit.id || visitIndex}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50"
                          onClick={() => navigate(`/leads/${visitGroup.leadId}`)}
                        >
                          <TableCell className="hidden sm:table-cell">
                            <div className="font-medium">{visitGroup.lead.store_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {visitGroup.lead.company_name}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="font-medium">{visitGroup.lead.contact_person}</div>
                            <div className="text-sm text-muted-foreground">
                              {visitGroup.lead.phone_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{new Date(visit.date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(visit.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {visit.status || 'No Status'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary" className="text-xs">
                              {visitGroup.lead.store_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {territories.find(t => t.id === visitGroup.lead.territory_id)?.city || 'Unknown'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {visitGroup.visitCount > 1 ? (
                              <Badge variant="secondary" className="text-xs">
                                #{visitIndex + 1} of {visitGroup.visitCount}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">1st</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/leads/${visitGroup.leadId}`);
                              }}
                              className="h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
