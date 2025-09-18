import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useCreateVisit } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getUKDate, getUKTime } from "@/utils/timeUtils";

export function ScheduleVisitDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isSalesperson } = useRoleAccess();
  const { data: leads } = useLeads();
  const createVisit = useCreateVisit();
  const { toast } = useToast();
  
  // Get current date and time
  const getCurrentDateTime = () => {
    const date = getUKDate(); // YYYY-MM-DD format in UK timezone
    const time = getUKTime(); // HH:MM format in UK timezone
    return { date, time };
  };
  
  const [visitData, setVisitData] = useState({
    lead_id: "",
    date: getCurrentDateTime().date,
    time: getCurrentDateTime().time,
    notes: "",
    status: "completed", // Changed to completed for immediate counting
  });
  
  const [leadSearch, setLeadSearch] = useState("");
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter leads based on search term
  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads || [];
    
    const searchTerm = leadSearch.toLowerCase();
    return (leads || []).filter(lead => 
      lead.store_name.toLowerCase().includes(searchTerm) ||
      lead.contact_person.toLowerCase().includes(searchTerm) ||
      lead.company_name.toLowerCase().includes(searchTerm) ||
      lead.postal_code?.toLowerCase().includes(searchTerm)
    );
  }, [leads, leadSearch]);

  // Get selected lead details for display
  const selectedLead = useMemo(() => {
    return leads?.find(lead => lead.id === visitData.lead_id);
  }, [leads, visitData.lead_id]);

  // Handle lead selection from search
  const handleLeadSelection = (leadId: string) => {
    const { time } = getCurrentDateTime();
    const selectedLead = leads?.find(lead => lead.id === leadId);
    
    setVisitData(prev => ({
      ...prev,
      lead_id: leadId,
      time: time // Auto-generate current time when lead is selected
    }));
    
    setLeadSearch(selectedLead?.store_name || "");
    setShowLeadDropdown(false);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLeadSearch(value);
    setShowLeadDropdown(true);
    
    // Clear selection if search doesn't match selected lead
    if (selectedLead && !value.toLowerCase().includes(selectedLead.store_name.toLowerCase())) {
      setVisitData(prev => ({ ...prev, lead_id: "" }));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setVisitData(prev => ({ ...prev, lead_id: "" }));
    setLeadSearch("");
    setShowLeadDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitData.lead_id || !visitData.date || !visitData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createVisit.mutateAsync({
        lead_id: visitData.lead_id,
        date: visitData.date,
        time: visitData.time,
        notes: visitData.notes,
        status: visitData.status,
        salesperson: profile?.name || user?.email || "Unknown",
      });
      
      toast({
        title: "Success",
        description: "Visit recorded successfully",
      });
      
      setOpen(false);
      setVisitData({
        lead_id: "",
        date: getCurrentDateTime().date,
        time: getCurrentDateTime().time,
        notes: "",
        status: "completed",
      });
      setLeadSearch("");
      setShowLeadDropdown(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record visit",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Record Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Visit</DialogTitle>
          <DialogDescription>
            Record a completed visit with an existing lead. Search for leads by store name, contact, company, or postal code. Date and time are auto-filled{isSalesperson ? ' and cannot be modified' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead *</Label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lead"
                  type="text"
                  placeholder="Search by store name, contact, company, or postal code..."
                  value={leadSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowLeadDropdown(true)}
                  className="pl-10 pr-10"
                />
                {leadSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={clearSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {showLeadDropdown && filteredLeads.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredLeads.slice(0, 10).map((lead) => (
                    <div
                      key={lead.id}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      onClick={() => handleLeadSelection(lead.id)}
                    >
                      <div className="font-medium text-sm">{lead.store_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.contact_person} • {lead.company_name}
                        {lead.postal_code && ` • ${lead.postal_code}`}
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length > 10 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                      Showing first 10 results. Refine your search for more specific results.
                    </div>
                  )}
                </div>
              )}
              
              {showLeadDropdown && leadSearch && filteredLeads.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No leads found matching "{leadSearch}"
                  </div>
                </div>
              )}
            </div>
            
            {selectedLead && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Selected: {selectedLead.store_name}
                </div>
                <div className="text-xs text-green-600 dark:text-green-300">
                  {selectedLead.contact_person} • {selectedLead.company_name}
                  {selectedLead.postal_code && ` • ${selectedLead.postal_code}`}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={visitData.date}
                onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                readOnly={isSalesperson}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={visitData.time}
                onChange={(e) => setVisitData({ ...visitData, time: e.target.value })}
                readOnly={isSalesperson}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={visitData.status} onValueChange={(value) => setVisitData({ ...visitData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={visitData.notes}
              onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
              placeholder="Add any notes for this visit"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Record Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 