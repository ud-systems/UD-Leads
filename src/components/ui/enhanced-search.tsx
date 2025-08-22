import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Store, Users, Phone, Mail } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: 'lead' | 'visit' | 'followup';
  id: string;
  title: string;
  subtitle: string;
  details: string[];
  counts?: {
    visits?: number;
    followups?: number;
  };
  data: any;
}

interface EnhancedSearchProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function EnhancedSearch({ 
  placeholder = "Search leads, visits, and follow-ups...", 
  className,
  onResultClick 
}: EnhancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Fetch data
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Search leads
    leads.forEach(lead => {
      const matches = [];
      let hasMatch = false;

      // Search by store name
      if (lead.store_name?.toLowerCase().includes(term)) {
        matches.push(`Store: ${lead.store_name}`);
        hasMatch = true;
      }

      // Search by territory
      if (lead.territory_id) {
        // You might need to get territory name from territories data
        matches.push(`Territory: ${lead.territory_id}`);
        hasMatch = true;
      }

      // Search by postal code
      if (lead.postal_code?.toLowerCase().includes(term)) {
        matches.push(`Postal Code: ${lead.postal_code}`);
        hasMatch = true;
      }

      // Search by contact person
      if (lead.contact_person?.toLowerCase().includes(term)) {
        matches.push(`Contact: ${lead.contact_person}`);
        hasMatch = true;
      }

      // Search by company name
      if (lead.company_name?.toLowerCase().includes(term)) {
        matches.push(`Company: ${lead.company_name}`);
        hasMatch = true;
      }

      if (hasMatch) {
        // Count visits for this lead
        const visitCount = visits.filter(visit => visit.lead_id === lead.id).length;
        
        // Count follow-ups (leads with next_visit)
        const followupCount = lead.next_visit ? 1 : 0;

        results.push({
          type: 'lead',
          id: lead.id,
          title: lead.store_name || 'Unnamed Store',
          subtitle: lead.company_name || lead.contact_person || 'No contact info',
          details: matches,
          counts: {
            visits: visitCount,
            followups: followupCount
          },
          data: lead
        });
      }
    });

    // Search visits
    visits.forEach(visit => {
      const lead = leads.find(l => l.id === visit.lead_id);
      if (!lead) return;

      const matches = [];
      let hasMatch = false;

      // Search by lead name in visit
      if (lead.store_name?.toLowerCase().includes(term)) {
        matches.push(`Lead: ${lead.store_name}`);
        hasMatch = true;
      }

      // Search by visit notes
      if (visit.notes?.toLowerCase().includes(term)) {
        matches.push(`Notes: ${visit.notes}`);
        hasMatch = true;
      }

      // Search by salesperson
      if (visit.salesperson?.toLowerCase().includes(term)) {
        matches.push(`Salesperson: ${visit.salesperson}`);
        hasMatch = true;
      }

      if (hasMatch) {
        results.push({
          type: 'visit',
          id: visit.id,
          title: `Visit - ${lead.store_name || 'Unnamed Store'}`,
          subtitle: visit.date ? new Date(visit.date).toLocaleDateString() : 'No date',
          details: matches,
          data: visit
        });
      }
    });

    // Search follow-ups (leads with next_visit)
    leads.filter(lead => lead.next_visit).forEach(lead => {
      const matches = [];
      let hasMatch = false;

      // Search by store name
      if (lead.store_name?.toLowerCase().includes(term)) {
        matches.push(`Store: ${lead.store_name}`);
        hasMatch = true;
      }

      // Search by follow-up date
      if (lead.next_visit?.toLowerCase().includes(term)) {
        matches.push(`Follow-up: ${new Date(lead.next_visit).toLocaleDateString()}`);
        hasMatch = true;
      }

      if (hasMatch) {
        results.push({
          type: 'followup',
          id: lead.id,
          title: `Follow-up - ${lead.store_name || 'Unnamed Store'}`,
          subtitle: lead.next_visit ? new Date(lead.next_visit).toLocaleDateString() : 'No date',
          details: matches,
          data: lead
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchTerm, leads, visits]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowResults(value.length > 0);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation
      if (result.type === 'lead') {
        navigate(`/leads/${result.id}`);
      } else if (result.type === 'visit') {
        navigate(`/visits`);
      } else if (result.type === 'followup') {
        navigate(`/followups`);
      }
    }
    setShowResults(false);
    setSearchTerm("");
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };

    if (showResults) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showResults]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4"
          onFocus={() => setShowResults(searchTerm.length > 0)}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchResults.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={result.type === 'lead' ? 'default' : result.type === 'visit' ? 'secondary' : 'outline'}>
                        {result.type}
                      </Badge>
                      <h4 className="font-medium text-sm">{result.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{result.subtitle}</p>
                    
                    {/* Match details */}
                    <div className="space-y-1">
                      {result.details.slice(0, 2).map((detail, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>

                    {/* Counts for leads */}
                    {result.type === 'lead' && result.counts && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Visited: {result.counts.visits}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Follow-ups: {result.counts.followups}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {showResults && searchTerm.length > 0 && searchResults.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50">
          <CardContent className="p-4 text-center text-muted-foreground">
            No results found for "{searchTerm}"
          </CardContent>
        </Card>
      )}
    </div>
  );
} 