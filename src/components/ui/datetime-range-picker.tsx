import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateTimeRange {
  from: Date;
  to: Date;
}

interface DateTimeRangePickerProps {
  value: DateTimeRange;
  onChange: (range: DateTimeRange) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimeRangePicker({
  value,
  onChange,
  className,
  placeholder = "Pick a date range",
  disabled = false
}: DateTimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(value?.from ? format(value.from, "yyyy-MM-dd") : "");
  const [endDate, setEndDate] = useState(value?.to ? format(value.to, "yyyy-MM-dd") : "");

  const quickSelectOptions = [
    {
      label: "Today",
      action: () => {
        const today = new Date();
        onChange({ from: today, to: today });
        setIsOpen(false);
      }
    },
    {
      label: "Yesterday",
      action: () => {
        const yesterday = subDays(new Date(), 1);
        onChange({ from: yesterday, to: yesterday });
        setIsOpen(false);
      }
    },
    {
      label: "Last 7 days",
      action: () => {
        const today = new Date();
        const sevenDaysAgo = subDays(today, 6);
        onChange({ from: sevenDaysAgo, to: today });
        setIsOpen(false);
      }
    },
    {
      label: "Last 30 days",
      action: () => {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 29);
        onChange({ from: thirtyDaysAgo, to: today });
        setIsOpen(false);
      }
    },
    {
      label: "This week",
      action: () => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        onChange({ from: weekStart, to: weekEnd });
        setIsOpen(false);
      }
    },
    {
      label: "Last week",
      action: () => {
        const today = new Date();
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        onChange({ from: lastWeekStart, to: lastWeekEnd });
        setIsOpen(false);
      }
    },
    {
      label: "This month",
      action: () => {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        onChange({ from: monthStart, to: monthEnd });
        setIsOpen(false);
      }
    },
    {
      label: "Last month",
      action: () => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);
        onChange({ from: lastMonthStart, to: lastMonthEnd });
        setIsOpen(false);
      }
    },
    {
      label: "This year",
      action: () => {
        const today = new Date();
        const yearStart = startOfYear(today);
        const yearEnd = endOfYear(today);
        onChange({ from: yearStart, to: yearEnd });
        setIsOpen(false);
      }
    },
    {
      label: "Last year",
      action: () => {
        const today = new Date();
        const lastYear = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearStart = startOfYear(lastYear);
        const lastYearEnd = endOfYear(lastYear);
        onChange({ from: lastYearStart, to: lastYearEnd });
        setIsOpen(false);
      }
    }
  ];

  const handleApply = () => {
    if (startDate && endDate) {
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      onChange({ from: fromDate, to: toDate });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onChange({ from: new Date(), to: new Date() });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value.from ? (
            value.to ? (
              <>
                {format(value.from, "MMM dd, yyyy")} -{" "}
                {format(value.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(value.from, "MMM dd, yyyy")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw] sm:max-w-none" align="start">
        <div className="flex flex-col sm:flex-row">
          {/* Quick Select Panel */}
          <div className="border-b sm:border-b-0 sm:border-r p-3 min-w-[200px] max-w-full sm:max-w-[200px]">
            <h4 className="font-medium text-sm mb-3">Quick Select</h4>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2">
              {quickSelectOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm h-7 sm:h-8"
                  onClick={option.action}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Input Panel */}
          <div className="p-4 min-w-[280px] max-w-full">
            <h4 className="font-medium text-sm mb-3">Custom Range</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="start-date-range">Start Date</Label>
                <Input
                  id="start-date-range"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date-range">End Date</Label>
                <Input
                  id="end-date-range"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleApply} 
                  className="flex-1"
                  disabled={!startDate || !endDate}
                >
                  Apply
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 