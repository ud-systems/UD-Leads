import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface Territory {
  id: string;
  city: string;
  region?: string;
  country?: string;
}

interface EnhancedTerritorySelectProps {
  territories: Territory[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EnhancedTerritorySelect({
  territories,
  value,
  onValueChange,
  placeholder = "Select territory...",
  className,
  disabled = false,
}: EnhancedTerritorySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { isMobile } = useIsMobile();

  const selectedTerritory = territories.find(territory => territory.id === value);

  const filteredTerritories = useMemo(() => {
    if (!searchTerm) return territories;
    
    const term = searchTerm.toLowerCase();
    return territories.filter(territory => 
      territory.city.toLowerCase().includes(term) ||
      territory.region?.toLowerCase().includes(term) ||
      territory.country?.toLowerCase().includes(term)
    );
  }, [territories, searchTerm]);

  const handleSelect = (territoryId: string) => {
    onValueChange(territoryId);
    setOpen(false);
    setSearchTerm("");
  };

  // Mobile-optimized component
  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium">Territory</Label>
        <div className="space-y-2">
          {territories.map((territory) => (
            <Button
              key={territory.id}
              variant={value === territory.id ? "default" : "outline"}
              className={cn(
                "w-full justify-start h-12 text-left",
                value === territory.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleSelect(territory.id)}
              disabled={disabled}
            >
              <MapPin className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{territory.city}</span>
                {territory.region && (
                  <span className="text-xs opacity-75">{territory.region}</span>
                )}
              </div>
              {value === territory.id && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop component with search
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedTerritory ? (
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{selectedTerritory.city}</span>
              {selectedTerritory.region && (
                <span className="ml-1 text-muted-foreground">
                  ({selectedTerritory.region})
                </span>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search territories..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No territory found.</CommandEmpty>
            <CommandGroup>
              {filteredTerritories.map((territory) => (
                <CommandItem
                  key={territory.id}
                  value={territory.id}
                  onSelect={() => handleSelect(territory.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{territory.city}</span>
                      {territory.region && (
                        <span className="text-xs text-muted-foreground">
                          {territory.region}
                        </span>
                      )}
                    </div>
                    {value === territory.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
