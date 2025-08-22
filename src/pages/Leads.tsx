import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Phone, Mail, MapPin, Calendar, Loader2, Grid3X3, List, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, Edit, Trash2, ArrowUpRight } from "lucide-react";
import { useLeads, useBulkUpdateLeads, useBulkDeleteLeads, useLeadVisitCount } from "@/hooks/useLeads";
import { useTerritories } from "@/hooks/useTerritories";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { useStoreTypeOptions } from "@/hooks/useSystemSettings";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { LeadPhotoDisplay } from "@/components/leads/LeadPhotoDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LeadsSkeleton } from "@/components/ui/leads-skeleton";
import { useUsers } from "@/hooks/useUsers";
import { useBuyingPowerOptions, useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DatePicker } from "@/components/ui/date-picker";

export default function Leads() {
  const navigate = useNavigate();
  const { isMobile, isSmallDesktop } = useIsMobile();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedStoreType, setSelectedStoreType] = useState("All");
  const [selectedWeeklySpend, setSelectedWeeklySpend] = useState("All");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const [selectedSalesperson, setSelectedSalesperson] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<any[]>([]);
  const [bulkEditData, setBulkEditData] = useState<Record<string, any>>({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const leadsPerPage = 15;

  const { data: leads = [], isLoading, error } = useLeads();
  const { toast } = useToast();
  const { canBulkOperations, userRole } = useRoleAccess();
  const { isCollapsed, getGridClasses } = useSidebarCollapsed();
  const bulkUpdateLeads = useBulkUpdateLeads();
  const bulkDeleteLeads = useBulkDeleteLeads();
  const storeTypeOptions = useStoreTypeOptions();
  const buyingPowerOptions = useBuyingPowerOptions();
  const statusOptions = useLeadStatusOptions();
  const { data: territories = [] } = useTerritories();
  const { data: users = [] } = useUsers();
  const { user: currentUser } = useAuth();
  const { data: profile } = useProfile(currentUser?.id);

  // Set view mode based on screen size
  useEffect(() => {
    setViewMode(isMobile ? "grid" : "list");
  }, [isMobile]);

  // Filter leads based on user role
  const roleFilteredLeads = useMemo(() => {
    if (!leads || !currentUser) return [];
    
    if (userRole === 'salesperson') {
      // Salesperson sees only their leads - match by either name or email
      const salespersonName = profile?.name || currentUser.email;
      const salespersonEmail = currentUser.email;
      return leads.filter(lead => 
        lead.salesperson === salespersonName || lead.salesperson === salespersonEmail
      );
    } else if (userRole === 'manager') {
      // Manager sees leads where they are the manager_id
      return leads.filter(lead => lead.manager_id === currentUser.id);
    }
    
    // Admin sees all leads
    return leads;
  }, [leads, userRole, currentUser, profile]);

  // Apply all filters
  const filteredLeads = useMemo(() => {
    return roleFilteredLeads.filter(lead => {
      // Search filter
      const matchesSearch = lead.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.salesperson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = selectedStatus === "All" || lead.status === selectedStatus;
      
      // Store type filter
      const matchesStoreType = selectedStoreType === "All" || lead.store_type === selectedStoreType;
      
      // Buying power filter
      const matchesBuyingPower = selectedWeeklySpend === "All" || lead.weekly_spend === selectedWeeklySpend;
      
      // Territory filter
      const leadTerritory = territories.find(t => t.id === lead.territory_id)?.city;
      const matchesTerritory = selectedTerritory === "All" || leadTerritory === selectedTerritory;
      
      // Salesperson filter
      const matchesSalesperson = userRole === 'salesperson' ? true : (selectedSalesperson === "All" || lead.salesperson === selectedSalesperson);
      
      // Date range filter
      const matchesDateRange = (() => {
        if (!dateRange) return true;
        if (!lead.created_at) return false;
        
        const leadDate = new Date(lead.created_at);
        
        // If both dates are the same (single day selection)
        if (dateRange?.from && dateRange?.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return leadDate.toDateString() === dateRange.from.toDateString();
        }
        
        // If only from date is selected
        if (dateRange?.from && !dateRange?.to) {
          return leadDate >= dateRange.from;
        }
        
        // If only to date is selected
        if (!dateRange?.from && dateRange?.to) {
          return leadDate <= dateRange.to;
        }
        
        // If both dates are selected (range)
        if (dateRange?.from && dateRange?.to) {
          return leadDate >= dateRange.from && leadDate <= dateRange.to;
        }
        
        return true;
      })();

      return matchesSearch && matchesStatus && matchesStoreType && matchesBuyingPower && 
             matchesTerritory && matchesSalesperson && matchesDateRange;
    });
  }, [roleFilteredLeads, searchTerm, selectedStatus, selectedStoreType, selectedWeeklySpend, 
      selectedTerritory, selectedSalesperson, dateRange, territories, userRole, currentUser]);

  // Calculate if all leads are selected
  const allLeadsSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;
  const someLeadsSelected = selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length;

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle individual lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  // Ref for select all checkbox
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  // Set indeterminate state on checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      (selectAllCheckboxRef.current as any).indeterminate = someLeadsSelected;
    }
  }, [someLeadsSelected]);

  // Handle errors properly without causing re-renders
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your retail leads</p>
        </div>
        <LeadsSkeleton />
      </div>
    );
  }

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + leadsPerPage);

  // Get status color variant
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new prospect':
        return 'secondary';
      case 'in discussion':
        return 'outline';
      case 'trial order':
        return 'default';
      case 'converted':
        return 'default';
      case 'follow-up required':
        return 'secondary';
      case 'no interest':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleBulkEdit = async () => {
    try {
      // Filter out any undefined or null values and ensure we have valid IDs
      const ids = selectedLeads.filter(id => id && typeof id === 'string');
      
      if (ids.length === 0) {
        toast({
          title: "No valid leads selected",
          description: "Please select valid leads to update",
          variant: "destructive",
        });
        return;
      }

      const filteredUpdates = Object.fromEntries(
        Object.entries(bulkEditData).filter(([_, value]) => value !== '')
      );

      if (Object.keys(filteredUpdates).length === 0) {
        toast({
          title: "No changes",
          description: "Please provide at least one field to update",
          variant: "destructive",
        });
        return;
      }

      await bulkUpdateLeads.mutateAsync({ ids, updates: filteredUpdates });
      toast({
        title: "Success",
        description: `Updated ${ids.length} leads successfully`,
      });
      setIsBulkEditOpen(false);
      setSelectedLeads([]);
      setBulkEditData({});
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast({
        title: "Error",
        description: "Failed to update leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Filter out any undefined or null values and ensure we have valid IDs
      const ids = selectedLeads.filter(id => id && typeof id === 'string');
      
      if (ids.length === 0) {
        toast({
          title: "No valid leads selected",
          description: "Please select valid leads to delete",
          variant: "destructive",
        });
        return;
      }

      await bulkDeleteLeads.mutateAsync(ids);
      toast({
        title: "Success",
        description: `Deleted ${ids.length} leads successfully`,
      });
      setIsBulkDeleteOpen(false);
      setSelectedLeads([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full space-y-4 lg:space-y-6 mobile-content small-desktop-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold truncate small-desktop-heading">Leads</h1>
          <p className="text-sm lg:text-base text-muted-foreground small-desktop-text">Manage your sales leads and prospects</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle - Only on Desktop */}
          {!isMobile && (
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
          )}
          <CreateLeadDialog />
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
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Controls - In the same row as search */}
        <div className={cn(
            "flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2",
          isMobile && !showFilters ? "hidden" : "flex"
        )}>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
            
          <Select value={selectedStoreType} onValueChange={setSelectedStoreType}>
              <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              {storeTypeOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
            
          <Select value={selectedWeeklySpend} onValueChange={setSelectedWeeklySpend}>
              <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
              <SelectValue placeholder="Power" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Power</SelectItem>
              {buyingPowerOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
            
          <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
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
            
          {userRole !== 'salesperson' && (
            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger className="w-full sm:w-[140px] text-base h-10">
                <SelectValue placeholder="Salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Salespeople</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Date Range Filter */}
          <DatePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range..."
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

      {/* Bulk Actions */}
      {canBulkOperations && selectedLeads.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <Badge variant="secondary" className="text-sm">
            {selectedLeads.length} selected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkEditOpen(true)}
            className="h-8"
          >
            <Edit className="h-4 w-4 mr-1" />
            Bulk Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkDeleteOpen(true)}
            className="h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Bulk Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLeads([])}
            className="h-8"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table View - Only when viewMode is list */}
      {viewMode === "list" && (
        <div className="rounded-md">
          <Table className="small-desktop-table">
            <TableHeader>
              <TableRow className="border-b">
                {canBulkOperations && (
                  <TableHead className="w-12">
                    <Checkbox
                      ref={selectAllCheckboxRef}
                      checked={allLeadsSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all leads"
                    />
                  </TableHead>
                )}
                <TableHead className="small-desktop-text">Store Name</TableHead>
                <TableHead className="small-desktop-text">Contact</TableHead>
                <TableHead className="small-desktop-text">Status</TableHead>
                <TableHead className="small-desktop-text">Store Type</TableHead>
                <TableHead className="small-desktop-text">Territory</TableHead>
                <TableHead className="small-desktop-text">Salesperson</TableHead>
                <TableHead className="small-desktop-text">Created</TableHead>
                <TableHead className="text-right small-desktop-text">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  {canBulkOperations && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => 
                          handleLeadSelection(lead.id, checked as boolean)
                        }
                        aria-label={`Select ${lead.store_name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="small-desktop-text">
                    <div className="font-medium">{lead.store_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {lead.company_name}
                    </div>
                  </TableCell>
                  <TableCell className="small-desktop-text">
                    <div className="font-medium">{lead.contact_person}</div>
                    <div className="text-sm text-muted-foreground">
                      {lead.phone_number}
                    </div>
                  </TableCell>
                  <TableCell className="small-desktop-text">
                    <Badge variant="lead-status" status={lead.status} isDark={isDark} className="text-xs flex-shrink-0">
                      {lead.status || 'No Status'}
                    </Badge>
                  </TableCell>
                  <TableCell className="small-desktop-text">
                    <Badge variant="store-type" storeType={lead.store_type} isDark={isDark}>
                      {lead.store_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="small-desktop-text">
                    {territories.find(t => t.id === lead.territory_id)?.city || 'Unknown'}
                  </TableCell>
                  <TableCell className="small-desktop-text">{lead.salesperson}</TableCell>
                  <TableCell className="small-desktop-text">
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
      )}

      {/* Grid View - Only when viewMode is grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedLeads.map((lead) => (
            <Card 
              key={lead.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              {/* Photo Display */}
              <div className="h-48 bg-muted overflow-hidden">
                <LeadPhotoDisplay
                  exteriorPhotos={lead.exterior_photos}
                  interiorPhotos={lead.interior_photos}
                  storeName={lead.store_name}
                  storeType={lead.store_type}
                  size="lg"
                  className="w-full h-full"
                />
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{lead.store_name}</CardTitle>
                    <CardDescription className="text-sm truncate">
                      {lead.company_name}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(lead.status)} className="text-xs flex-shrink-0">
                    {lead.status || 'No Status'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {territories?.find(t => t.id === lead.territory_id)?.city || 'No territory'}
                    </span>
                  </div>
                  {lead.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{lead.phone_number}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {lead.store_type && (
                    <Badge variant="store-type" storeType={lead.store_type} isDark={isDark} className="text-xs">
                      {lead.store_type}
                    </Badge>
                  )}
                  {lead.weekly_spend && (
                    <Badge variant="outline" className="text-xs">
                      {lead.weekly_spend}
                    </Badge>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    {lead.salesperson}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/leads/${lead.id}`);
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
      {filteredLeads.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
          </div>
          <div className="flex items-center gap-2">
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
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
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

      {filteredLeads.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leads found matching your criteria.</p>
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Leads</DialogTitle>
            <DialogDescription>
              Update {selectedLeads.length} selected leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-status">Status</Label>
                <Select
                  value={bulkEditData.status || ""}
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulk-store-type">Store Type</Label>
                <Select
                  value={bulkEditData.store_type || ""}
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, store_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeTypeOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bulk-notes">Notes</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Add notes..."
                value={bulkEditData.notes || ""}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEdit}>
              Update Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leads</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLeads.length} selected leads? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedLeads.length} Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 