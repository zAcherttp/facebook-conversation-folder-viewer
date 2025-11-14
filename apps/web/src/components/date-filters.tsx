import { ChevronDownIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Message } from "@/lib/messageUtils";

interface DateFiltersProps {
  messages: Message[];
  onFilterChange: (filtered: Message[]) => void;
}

export function DateFilters({ messages, onFilterChange }: DateFiltersProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  // Filter messages based on date range
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    if (range?.from) {
      const start = range.from.getTime();
      filtered = filtered.filter((msg) => msg.timestamp_ms >= start);
    }

    if (range?.to) {
      const end = range.to.getTime() + 86400000 - 1; // End of day
      filtered = filtered.filter((msg) => msg.timestamp_ms <= end);
    }

    return filtered;
  }, [messages, range]);

  // Update parent when filtered messages change
  useEffect(() => {
    onFilterChange(filteredMessages);
  }, [filteredMessages, onFilterChange]);

  const handleClearDates = () => {
    setRange(undefined);
  };

  return (
    <div className="space-y-3">
      {/* Date Range Picker */}
      <div className="space-y-2">
        <Label htmlFor="dates" className="text-muted-foreground text-xs">
          Date Range
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="dates"
              className="w-full justify-between font-normal"
            >
              {range?.from && range?.to
                ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                : range?.from
                  ? range.from.toLocaleDateString()
                  : "Pick a date range"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(selectedRange) => {
                setRange(selectedRange);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Filter Summary */}
      {range?.from && (
        <div className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Showing{" "}
              <span className="font-medium">{filteredMessages.length}</span> of{" "}
              <span className="font-medium">{messages.length}</span> messages
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClearDates}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
