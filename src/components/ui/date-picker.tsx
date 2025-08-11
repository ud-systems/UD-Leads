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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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
      <PopoverContent className="w-auto p-0 min-w-[280px] max-w-[95vw] sm:min-w-[320px] date-picker-mobile" align="start">
        <div className="p-3 sm:p-4">
          {/* Calendar Header with Month/Year Dropdowns */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 calendar-header">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 sm:gap-2 calendar-dropdowns flex-1 sm:flex-none">
                <Select value={currentMonth.toString()} onValueChange={(value) => handleMonthChange(parseInt(value))}>
                  <SelectTrigger className="w-16 sm:w-20 h-8 border border-input bg-background text-xs sm:text-sm font-medium hover:bg-muted select-trigger">
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
                  <SelectTrigger className="w-14 sm:w-16 h-8 border border-input bg-background text-xs sm:text-sm font-medium hover:bg-muted select-trigger">
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
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={displayValue}
            onSelect={handleDateSelect}
            className="rounded-md border-0 w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 