import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { id: string; name: string; [key: string]: any }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  multiple?: boolean;
  onSearch?: (searchTerm: string) => void;
  onCreateNew?: (name: string) => void;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  multiple = false,
  onSearch,
  onCreateNew,
  loading = false
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  }, [searchTerm, onSearch]);

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValue = value.includes(selectedValue)
        ? value.filter(v => v !== selectedValue)
        : [...value, selectedValue];
      onChange(newValue);
    } else {
      onChange([selectedValue]);
      setOpen(false);
    }
  };

  const handleCreateNew = () => {
    if (newItemName.trim() && onCreateNew) {
      onCreateNew(newItemName.trim());
      setNewItemName("");
      setSearchTerm("");
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.id === value[0]);
        return option?.name || value[0];
      }
      return `${value.length} selected`;
    } else {
      if (value.length === 0) return placeholder;
      const option = options.find(opt => opt.id === value[0]);
      return option?.name || value[0];
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {getDisplayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              ref={inputRef}
            />
            <CommandList>
              <CommandEmpty>
                {emptyText}
                {onCreateNew && searchTerm.trim() && (
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter new name..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateNew();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateNew}
                        disabled={!newItemName.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 