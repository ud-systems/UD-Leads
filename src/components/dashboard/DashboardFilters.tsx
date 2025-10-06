import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getPresetDateRange, isDateRangePreset } from "@/utils/dateRangeUtils";

export interface DashboardFilters {
  selectedSalesperson: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  salespeople: Array<{ id: string; name: string }>;
  className?: string;
}

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  salespeople, 
  className 
}: DashboardFiltersProps) {
  const { isSalesperson } = useRoleAccess();

  const handleSalespersonChange = (value: string) => {
    onFiltersChange({
      ...filters,
      selectedSalesperson: value
    });
  };

  const handleDateChange = (range: { from: Date; to: Date } | undefined) => {
    onFiltersChange({
      ...filters,
              dateRange: range || undefined
    });
  };

  const clearFilters = () => {
    const today = new Date();
    onFiltersChange({
      selectedSalesperson: 'all',
              dateRange: undefined
    });
  };

  const hasActiveFilters = filters.selectedSalesperson !== 'all' || 
                          (filters.dateRange && (filters.dateRange.from || filters.dateRange.to));

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="pt-6">
        <div className={cn(
          "grid gap-4",
          isSalesperson ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"
        )}>
          {/* Salesperson Filter - Hidden for salespeople */}
          {!isSalesperson && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Salesperson
              </label>
              <Select value={filters.selectedSalesperson} onValueChange={handleSalespersonChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespeople</SelectItem>
                  {salespeople.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter - Preset Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!filters.dateRange ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateChange(undefined)}
                className={!filters.dateRange ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
              >
                All Time
              </Button>
              <Button
                variant={isDateRangePreset(filters.dateRange, 'thisWeek') ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateChange(getPresetDateRange('thisWeek'))}
              >
                This Week
              </Button>
              <Button
                variant={isDateRangePreset(filters.dateRange, 'today') ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateChange(getPresetDateRange('today'))}
              >
                Today
              </Button>
              <Button
                variant={isDateRangePreset(filters.dateRange, 'last7Days') ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateChange(getPresetDateRange('last7Days'))}
              >
                Last 7 Days
              </Button>
              <Button
                variant={isDateRangePreset(filters.dateRange, 'last30Days') ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateChange(getPresetDateRange('last30Days'))}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {!isSalesperson && filters.selectedSalesperson !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {salespeople.find(p => p.id === filters.selectedSalesperson)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => handleSalespersonChange('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.dateRange && filters.dateRange.from && (
                <Badge variant="secondary" className="gap-1">
                  📅
                  {filters.dateRange.from.toDateString() === filters.dateRange.to.toDateString() ? (
                    format(filters.dateRange.from, "MMM dd, yyyy")
                  ) : (
                    `${format(filters.dateRange.from, "MMM dd")} - ${format(filters.dateRange.to, "MMM dd")}`
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => {
                      handleDateChange(undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 