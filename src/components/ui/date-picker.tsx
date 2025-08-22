import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
  const [startDate, setStartDate] = useState(value?.from ? format(value.from, "yyyy-MM-dd") : "");
  const [endDate, setEndDate] = useState(value?.to ? format(value.to, "yyyy-MM-dd") : "");

  // Handle undefined value for "All Records" display
  const displayValue = value;

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
    onChange(undefined);
    setIsOpen(false);
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
          {displayValue ? (
            displayValue.from.toDateString() === displayValue.to.toDateString() ? (
              <span>{format(displayValue.from, "MMM dd, yyyy")}</span>
            ) : (
              <span>{format(displayValue.from, "MMM dd, yyyy")} - {format(displayValue.to, "MMM dd, yyyy")}</span>
            )
          ) : (
            <span>All Records</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 max-w-[95vw] sm:max-w-none" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
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
      </PopoverContent>
    </Popover>
  );
} 