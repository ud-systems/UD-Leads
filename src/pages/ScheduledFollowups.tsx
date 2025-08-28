import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Store, 
  DollarSign, 
  Users, 
  Phone,
  Mail,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Target
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { LeadsSkeleton } from "@/components/ui/leads-skeleton";
import { format } from "date-fns";
import { EditFollowupDialog } from "@/components/leads/EditFollowupDialog";
import { DeleteFollowupDialog } from "@/components/leads/DeleteFollowupDialog";
import { Lead } from "@/hooks/useLeads";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ScheduledFollowups() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();
  const { toast } = useToast();
  const { isMobile } = useIsMobile();
  const navigate = useNavigate();
  
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreType, setSelectedStoreType] = useState("All");
  const [selectedBuyingPower, setSelectedBuyingPower] = useState("All");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const [selectedSalesperson, setSelectedSalesperson] = useState("All");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(10);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true); // New state for showing/hiding filters

  // CRUD state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch data
  const { data: leads, isLoading, error } = useLeads();
  const { data: territories, isLoading: territoriesLoading } = useTerritories();
  const { data: users, isLoading: usersLoading } = useUsers();

  // Get current user profile
  const currentUser = users?.find(u => u.id === user?.id);

  // Filter leads to only show those with scheduled followups
  const leadsWithFollowups = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => lead.next_visit);
  }, [leads]);

  // Apply role-based filtering
  const roleFilteredLeads = useMemo(() => {
    if (!leadsWithFollowups || !currentUser) return [];
    
    if (isSalesperson) {
      // Match by either name or email
      const salespersonName = profile?.name || currentUser.email;
      const salespersonEmail = currentUser.email;
      return leadsWithFollowups.filter(lead => 
        lead.salesperson === salespersonName || lead.salesperson === salespersonEmail
      );
    } else if (isManager) {
      return leadsWithFollowups.filter(lead => lead.manager_id === currentUser.id);
    } else if (isAdmin) {
      return leadsWithFollowups;
    }
    
    return leadsWithFollowups;
  }, [leadsWithFollowups, currentUser, isSalesperson, isManager, isAdmin, profile]);

  // Apply all filters
  const filteredLeads = useMemo(() => {
    const filtered = roleFilteredLeads.filter(lead => {
      // Search filter
      const matchesSearch = !searchTerm || 
        lead.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_number?.includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.address?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = true; // Removed status filtering
      
      // Store type filter
      const matchesStoreType = selectedStoreType === "All" || lead.store_type === selectedStoreType;
      
      // Buying power filter
      const matchesBuyingPower = selectedBuyingPower === "All" || lead.weekly_spend === selectedBuyingPower;
      
      // Territory filter
      const leadTerritory = territories?.find(t => t.id === lead.territory_id)?.city;
      const matchesTerritory = selectedTerritory === "All" || leadTerritory === selectedTerritory;
      
      // Salesperson filter
      const matchesSalesperson = isSalesperson ? true : (selectedSalesperson === "All" || lead.salesperson === selectedSalesperson);
      
      // Date range filter
      const matchesDateRange = (() => {
        if (!dateRange) return true;
        if (!lead.next_visit) return false;
        
        const followupDate = new Date(lead.next_visit);
        
        // If both dates are the same (single day selection)
        if (dateRange?.from && dateRange?.to && 
            dateRange.from.toDateString() === dateRange.to.toDateString()) {
          return followupDate.toDateString() === dateRange.from.toDateString();
        }
        
        // If only from date is selected
        if (dateRange?.from && !dateRange?.to) {
          return followupDate >= dateRange.from;
        }
        
        // If only to date is selected
        if (!dateRange?.from && dateRange?.to) {
          return followupDate <= dateRange.to;
        }
        
        // If both dates are selected (range)
        if (dateRange?.from && dateRange?.to) {
          return followupDate >= dateRange.from && followupDate <= dateRange.to;
        }
        
        return true;
      })();

      return matchesSearch && matchesStatus && matchesStoreType && matchesBuyingPower && 
             matchesTerritory && matchesSalesperson && matchesDateRange;
    });

    return filtered;
  }, [roleFilteredLeads, searchTerm, selectedStoreType, selectedBuyingPower, 
      selectedTerritory, selectedSalesperson, dateRange, territories, isSalesperson]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + leadsPerPage);

  // Selection state
  const allLeadsSelected = paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length;
  const someLeadsSelected = selectedLeads.length > 0 && selectedLeads.length < paginatedLeads.length;
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle individual lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => {
      if (checked) {
        return [...prev, leadId];
      } else {
        return prev.filter(id => id !== leadId);
      }
    });
  };

  // CRUD handlers
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteDialogOpen(true);
  };

  // Get buying power color
  const getBuyingPowerColor = (power: string) => {
    switch (power?.toLowerCase()) {
      case 'high':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Scheduled Followups</h1>
        </div>
        <LeadsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold truncate">Scheduled Followups</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage your scheduled followups</p>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col gap-4">
        {/* Search and Filter Row - All in one horizontal row */}
        <div className="flex flex-col lg:flex-row gap-3 w-full">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            <Select value={selectedStoreType} onValueChange={setSelectedStoreType}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Store Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBuyingPower} onValueChange={setSelectedBuyingPower}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Buying Power" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Powers</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Territories</SelectItem>
                {territories?.map((territory) => (
                  <SelectItem key={territory.id} value={territory.city}>
                    {territory.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!isSalesperson && (
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <SelectValue placeholder="Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Salespeople</SelectItem>
                  {users?.filter(u => (u as any).role === 'salesperson').map((user) => (
                    <SelectItem key={user.id} value={(user as any).name}>
                      {(user as any).name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <DatePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by followup date..."
                className="w-full sm:w-[200px] h-10"
              />
              {dateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange(undefined)}
                  className="h-10 px-3"
                >
                  Clear
                </Button>
              )}
            </div>
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

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredLeads.length} of {leadsWithFollowups.length} scheduled followups
          </span>
          {selectedLeads.length > 0 && (
            <span className="font-medium">{selectedLeads.length} selected</span>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">
                <Checkbox
                  ref={selectAllCheckboxRef}
                  checked={allLeadsSelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left p-2 text-sm font-semibold">Store Name</th>
              <th className="text-left p-2 text-sm font-semibold">Contact</th>
              <th className="text-left p-2 text-sm font-semibold">Followup Date</th>
              <th className="text-left p-2 text-sm font-semibold">Territory</th>
              <th className="text-left p-2 text-sm font-semibold">Salesperson</th>
              <th className="text-left p-2 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isSalesperson ? "No Followups Scheduled" : "No Scheduled Followups"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isSalesperson 
                      ? "You don't have any leads with scheduled followup dates. Create leads and set followup dates to see them here."
                      : "There are no leads with scheduled followup dates in your view."
                    }
                  </p>
                  <Button onClick={() => navigate('/leads')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isSalesperson ? "Create Lead" : "View All Leads"}
                  </Button>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                  <td className="p-2">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium text-sm">{lead.store_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {lead.store_type}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium text-sm">{lead.contact_person}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone_number}
                      </div>
                      {lead.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">
                          {lead.next_visit ? format(new Date(lead.next_visit), 'MMM dd, yyyy') : 'Not set'}
                        </div>
                        {lead.next_visit && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(lead.next_visit), 'EEEE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {territories?.find(t => t.id === lead.territory_id)?.city || 'Unknown'}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" />
                      {lead.salesperson}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Followup
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(lead)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Followup
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Row View */}
      <div className="md:hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isSalesperson ? "No Followups Scheduled" : "No Scheduled Followups"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isSalesperson 
                ? "You don't have any leads with scheduled followup dates. Create leads and set followup dates to see them here."
                : "There are no leads with scheduled followup dates in your view."
              }
            </p>
            <Button onClick={() => navigate('/leads')} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSalesperson ? "Create Lead" : "View All Leads"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedLeads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{lead.store_name}</h3>
                    <p className="text-xs text-muted-foreground">{lead.contact_person}</p>
                  </div>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">
                      {lead.next_visit ? format(new Date(lead.next_visit), 'MMM dd, yyyy') : 'Not set'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{territories?.find(t => t.id === lead.territory_id)?.city || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{lead.salesperson}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(lead)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(lead)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && filteredLeads.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* CRUD Dialogs */}
      <EditFollowupDialog
        lead={editingLead}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      
      <DeleteFollowupDialog
        lead={deletingLead}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
} 