import { useState, useEffect, useRef } from "react";
import { Search, Filter, X, Save, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'lead' | 'visit' | 'territory' | 'user';
  url: string;
}

interface SearchFilter {
  type: string[];
  status: string[];
  territory: string[];
  dateRange: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  timestamp: string;
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilter) => void;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
  data?: any[];
  filterOptions?: {
    types?: string[];
    statuses?: string[];
    territories?: string[];
  };
}

export function EnhancedSearch({
  placeholder = "Search leads, visits, territories...",
  onSearch,
  onResultSelect,
  className,
  data = [],
  filterOptions = {}
}: EnhancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter>({
    type: [],
    status: [],
    territory: [],
    dateRange: "all"
  });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  // Save searches to localStorage
  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      setResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  const performSearch = () => {
    // Simulate search through data
    const searchResults: SearchResult[] = [];
    
    if (data && query.trim()) {
      const searchTerm = query.toLowerCase();
      
      data.forEach((item) => {
        // Search in various fields
        const searchableText = [
          item.store_name || item.name || '',
          item.company_name || '',
          item.contact_person || '',
          item.status || '',
          item.salesperson || '',
          item.city || '',
          item.notes || ''
        ].join(' ').toLowerCase();

        if (searchableText.includes(searchTerm)) {
          searchResults.push({
            id: item.id,
            title: item.store_name || item.name || 'Unknown',
            subtitle: item.company_name || item.contact_person || '',
            type: item.type || 'lead',
            url: `/leads/${item.id}`
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setIsSearching(false);
  };

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result);
    setQuery("");
    setResults([]);
  };

  const saveCurrentSearch = () => {
    if (!query.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: `Search: ${query}`,
      query,
      filters,
      timestamp: new Date().toISOString()
    };

    setSavedSearches(prev => [newSavedSearch, ...prev.slice(0, 9)]); // Keep only 10 saved searches
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowSavedSearches(false);
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      status: [],
      territory: [],
      dateRange: "all"
    });
  };

  const hasActiveFilters = filters.type.length > 0 || 
                          filters.status.length > 0 || 
                          filters.territory.length > 0 || 
                          filters.dateRange !== "all";

  return (
    <div className={cn("relative", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        
        {/* Filter Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "ghost"}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {filters.type.length + filters.status.length + filters.territory.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Type Filter */}
              {filterOptions.types && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.types.map((type) => (
                      <Badge
                        key={type}
                        variant={filters.type.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            type: prev.type.includes(type)
                              ? prev.type.filter(t => t !== type)
                              : [...prev.type, type]
                          }));
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Filter */}
              {filterOptions.statuses && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.statuses.map((status) => (
                      <Badge
                        key={status}
                        variant={filters.status.includes(status) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            status: prev.status.includes(status)
                              ? prev.status.filter(s => s !== status)
                              : [...prev.status, status]
                          }));
                        }}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Territory Filter */}
              {filterOptions.territories && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Territory</label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.territories.map((territory) => (
                      <Badge
                        key={territory}
                        variant={filters.territory.includes(territory) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            territory: prev.territory.includes(territory)
                              ? prev.territory.filter(t => t !== territory)
                              : [...prev.territory, territory]
                          }));
                        }}
                      >
                        {territory}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Results Dropdown */}
      {(results.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : (
            <Command>
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultSelect(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex-1">
                          <div className="font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </div>
      )}

      {/* Saved Searches */}
      <Popover open={showSavedSearches} onOpenChange={setShowSavedSearches}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Saved Searches</h4>
              {query.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveCurrentSearch}
                  className="h-6 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
            </div>
            
            {savedSearches.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No saved searches
              </div>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((savedSearch) => (
                  <div
                    key={savedSearch.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => loadSavedSearch(savedSearch)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{savedSearch.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {savedSearch.query}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedSearch(savedSearch.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 