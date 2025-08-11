import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format, getYear, getMonth, setYear, setMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date;
  to: Date;
}

interface DatePickerProps {
  value?: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date range...",
  disabled = false,
  className
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value?.from || new Date());

  // Ensure we always have a valid date range for display
  const displayValue = value || { from: new Date(), to: new Date() };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);

  // Generate years (current year ± 10 years)
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleMonthChange = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = setYear(currentDate, year);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue.from && displayValue.to ? (
            displayValue.from.toDateString() === displayValue.to.toDateString() ? (
              <span>{format(displayValue.from, "MMM dd, yyyy")}</span>
            ) : (
              <span>{format(displayValue.from, "MMM dd, yyyy")} - {format(displayValue.to, "MMM dd, yyyy")}</span>
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw] sm:max-w-none" align="start">
        <div className="p-2 sm:p-4">
          {/* Mobile-optimized Calendar Header */}
          <div className="flex items-center justify-between mb-3 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-7 w-7 p-0 hover:bg-muted flex-shrink-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <div className="flex items-center gap-1 flex-1 justify-center">
              <Select value={currentMonth.toString()} onValueChange={(value) => handleMonthChange(parseInt(value))}>
                <SelectTrigger className="w-14 h-7 border border-input bg-background text-xs font-medium hover:bg-muted">
                  <SelectValue />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={currentYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                <SelectTrigger className="w-16 h-7 border border-input bg-background text-xs font-medium hover:bg-muted">
                  <SelectValue />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-7 w-7 p-0 hover:bg-muted flex-shrink-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={displayValue}
            onSelect={handleDateSelect}
            className="rounded-md border-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 