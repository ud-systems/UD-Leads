
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useLeads } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { RecordVisitDialog } from "@/components/visits/RecordVisitDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, User, Search, Filter, Plus, CalendarDays, CheckCircle, XCircle, AlertCircle, List, Grid3X3, ArrowUpRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { VisitsSkeleton } from "@/components/ui/visits-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDebounce } from "@/hooks/useDebounce";
import { DatePicker } from "@/components/ui/date-picker";

export default function Visits() {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSalesperson, setSelectedSalesperson] = useState("All");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const visitsPerPage = 15;

  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { data: territories = [], isLoading: territoriesLoading } = useTerritories();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { toast } = useToast();
  const { canCreate, userRole, isSalesperson, isManager, isAdmin } = useRoleAccess();
  const canScheduleVisits = canCreate('visits');
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);

  // Determine page title based on user role
  const pageTitle = isSalesperson ? "My Visits" : "Visits";
  const pageDescription = isSalesperson ? "Track and manage your sales visits" : "Manage and track sales visits";

  // Filter visits based on user role
  const roleFilteredVisits = useMemo(() => {
    if (!visits || !currentUser) return [];
    
    if (userRole === 'salesperson') {
      // Salesperson sees only their visits - match by either name or email
      const salespersonName = profile?.name || currentUser.email;
      const salespersonEmail = currentUser.email;
      return visits.filter(groupedVisit => 
        groupedVisit.lastVisit.salesperson === salespersonName || 
        groupedVisit.lastVisit.salesperson === salespersonEmail
      );
    } else if (userRole === 'manager') {
      // Managers can see BOTH their historical visits AND team visits
      const managerName = profile?.name || currentUser.email;
      return visits.filter(groupedVisit => 
        groupedVisit.lastVisit.manager_id === currentUser.id || 
        groupedVisit.lastVisit.salesperson === managerName
      );
    }
    
    // Admin sees all visits
    return visits;
  }, [visits, userRole, currentUser, profile]);

  // Filter users with salesperson/manager role
  const salespeople = useMemo(() => {
    const roleFilter = isAdmin ? ['salesperson', 'manager'] : ['salesperson'];
    const allUsers = users.filter(user => roleFilter.includes((user as any).role));
    
    if (userRole === 'manager' && currentUser) {
      // Manager sees themselves + their team members (salespeople only)
      return allUsers.filter(user => 
        // Include themselves (manager)
        (user.id === currentUser.id && (user as any).role === 'manager') ||
        // Include their team members (salespeople only)
        ((user as any).role === 'salesperson' && (user as any).manager_id === currentUser.id)
      );
    }
    
    return allUsers;
  }, [users, userRole, currentUser, isAdmin]);

  const filteredVisits = useMemo(() => {
    return roleFilteredVisits.filter(groupedVisit => {
      const leadTerritory = territories.find(t => t.id === groupedVisit.lead.territory_id)?.city;
      const matchesSearch = 
        groupedVisit.lead.store_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.company_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.contact_person?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.phone_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.salesperson?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        groupedVisit.lead.postal_code?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        leadTerritory?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "All" || groupedVisit.lastVisit.status === selectedStatus;
      const matchesSalesperson = selectedSalesperson === "All" || groupedVisit.lastVisit.salesperson === selectedSalesperson;
      
      const matchesTerritory = selectedTerritory === "All" || leadTerritory === selectedTerritory;

      // Date range filtering
      const visitDate = new Date(groupedVisit.lastVisit.date);
      const matchesDateRange = (() => {
        if (!dateRange) return true;
        
        // If both dates are the same (single day selection)
        if (dateRange?.from && dateRange?.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return visitDate.toDateString() === dateRange.from.toDateString();
        }
        
        // If only from date is selected
        if (dateRange?.from && !dateRange?.to) {
          return visitDate >= dateRange.from;
        }
        
        // If only to date is selected
        if (!dateRange?.from && dateRange?.to) {
          return visitDate <= dateRange.to;
        }
        
        // If both dates are selected (range)
        if (dateRange?.from && dateRange?.to) {
          return visitDate >= dateRange.from && visitDate <= dateRange.to;
        }
        
        return true;
      })();

      return matchesSearch && matchesStatus && matchesSalesperson && matchesTerritory && matchesDateRange;
    });
  }, [roleFilteredVisits, debouncedSearchTerm, selectedStatus, selectedSalesperson, selectedTerritory, territories, dateRange]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredVisits.length / visitsPerPage);
  const startIndex = (currentPage - 1) * visitsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + visitsPerPage);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedVisits(paginatedVisits.map(visit => visit.lead.id));
    } else {
      setSelectedVisits([]);
    }
  };

  const handleVisitSelection = (visitId: string, checked: boolean | 'indeterminate') => {
    setSelectedVisits(prev => {
      if (checked === true) {
        return [...prev, visitId];
      } else {
        return prev.filter(id => id !== visitId);
      }
    });
  };

  // Show skeleton while loading
  if (visitsLoading || territoriesLoading || leadsLoading || usersLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Visits</h1>
          <p className="text-muted-foreground">Manage and track sales visits</p>
        </div>
        <VisitsSkeleton />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'rescheduled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold truncate">{pageTitle}</h1>
          <p className="text-sm lg:text-base text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="w-full sm:w-auto">
          {canScheduleVisits && <RecordVisitDialog />}
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col gap-4">
        {/* Search and Filter Row - All in one horizontal row */}
        <div className="flex flex-col lg:flex-row gap-3 w-full">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visits, postal codes, territories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-10"
            />
          </div>
          
          {/* Filter Controls - In the same row as search */}
          <div className={cn(
            "flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2",
            isMobile && !showFilters ? "hidden" : "flex"
          )}>
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
            
            {!isSalesperson && (
              <Select value={selectedSalesperson} onValueChange={(value) => {
                setSelectedSalesperson(value);
                handleFilterChange();
              }}>
                <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
                  <SelectValue placeholder="Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All {isAdmin ? 'Team Members' : 'Salespeople'}</SelectItem>
                  {salespeople.map(salesperson => (
                    <SelectItem key={salesperson.id} value={salesperson.name}>
                      <div className="flex items-center gap-2">
                        {(salesperson as any).role === 'manager' && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            Manager
                          </Badge>
                        )}
                        {salesperson.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={selectedTerritory} onValueChange={(value) => {
              setSelectedTerritory(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
                <SelectValue placeholder="Territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Territories</SelectItem>
                {territories.map(territory => (
                  <SelectItem key={territory.id} value={territory.city}>{territory.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Date Range Filter */}
            <DatePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter by visit date..."
              className="w-full sm:w-[200px] text-base h-10"
            />
          </div>
          
          {/* Show/Hide Filters Button - Only on Mobile */}
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredVisits.length} of {roleFilteredVisits.length} visits
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
        </div>
      </div>

      {/* Table View - Only on Desktop when viewMode is list */}
      {!isMobile && viewMode === "list" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedVisits.length === filteredVisits.length && filteredVisits.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Postal Code</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVisits.map((groupedVisit) => (
                <TableRow 
                  key={groupedVisit.lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/leads/${groupedVisit.lead.id}`)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedVisits.includes(groupedVisit.lead.id)}
                      onCheckedChange={(checked) => 
                        handleVisitSelection(groupedVisit.lead.id, checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{groupedVisit.lead.store_name}</span>
                      <span className="text-sm text-muted-foreground">{groupedVisit.lead.company_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(groupedVisit.lastVisit.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{groupedVisit.lastVisit.time}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(groupedVisit.lastVisit.status)}>
                      {groupedVisit.lastVisit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{groupedVisit.lastVisit.salesperson}</TableCell>
                  <TableCell>
                    {groupedVisit.lead.postal_code || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{groupedVisit.allVisits.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/leads/${groupedVisit.lead.id}`);
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
      )}

      {/* Grid View - Only on Mobile or when viewMode is grid */}
      {(isMobile || viewMode === "grid") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedVisits.map((groupedVisit) => (
            <Card 
              key={groupedVisit.lead.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/leads/${groupedVisit.lead.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{groupedVisit.lead.store_name}</CardTitle>
                    <CardDescription className="text-sm truncate">
                      {groupedVisit.lead.company_name}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(groupedVisit.lastVisit.status)}>
                    {groupedVisit.lastVisit.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Visit Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {new Date(groupedVisit.lastVisit.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{groupedVisit.lastVisit.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>{groupedVisit.lastVisit.salesperson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {groupedVisit.lead.postal_code || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Visit Count */}
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-xs">
                    {groupedVisit.allVisits.length} visits
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/leads/${groupedVisit.lead.id}`);
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredVisits.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + visitsPerPage, filteredVisits.length)} of {filteredVisits.length} visits
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {(() => {
                const pages = [];
                let startPage = 1;
                let endPage = totalPages;
                
                if (totalPages <= 5) {
                  startPage = 1;
                  endPage = totalPages;
                } else if (currentPage <= 3) {
                  startPage = 1;
                  endPage = 5;
                } else if (currentPage >= totalPages - 2) {
                  startPage = totalPages - 4;
                  endPage = totalPages;
                } else {
                  startPage = currentPage - 2;
                  endPage = currentPage + 2;
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className="w-8 h-8"
                    >
                      {i}
                    </Button>
                  );
                }
                return pages;
              })()}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredVisits.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No visits found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
