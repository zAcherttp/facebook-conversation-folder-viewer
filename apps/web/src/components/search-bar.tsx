import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Message } from "@/lib/messageUtils";

interface SearchBarProps {
  messages: Message[];
  onMessageSelect: (messageId: string) => void;
  onFilterChange: (filtered: Message[]) => void;
}

export function SearchBar({
  messages,
  onMessageSelect,
  onFilterChange,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Filter messages based on search and date range
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          msg.content?.toLowerCase().includes(term) ||
          msg.sender_name.toLowerCase().includes(term),
      );
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((msg) => msg.timestamp_ms >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000 - 1; // End of day
      filtered = filtered.filter((msg) => msg.timestamp_ms <= end);
    }

    return filtered;
  }, [messages, searchTerm, startDate, endDate]);

  // Update parent when filtered messages change
  useEffect(() => {
    onFilterChange(filteredMessages);
  }, [filteredMessages, onFilterChange]);

  // Show top 50 search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return filteredMessages.slice(0, 50);
  }, [searchTerm, filteredMessages]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowResults(false);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleResultClick = (messageId: string) => {
    onMessageSelect(messageId);
    setShowResults(false);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search messages or sender names..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(e.target.value.trim().length > 0);
          }}
          onFocus={() => setShowResults(searchTerm.trim().length > 0)}
          className="pr-9 pl-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-full"
            onClick={handleClearSearch}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <Card className="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto">
            <div className="p-2">
              <p className="mb-2 px-2 text-muted-foreground text-xs">
                Showing {searchResults.length} of {filteredMessages.length}{" "}
                results
              </p>
              {searchResults.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleResultClick(msg.id)}
                  className="w-full rounded p-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm">
                      {msg.sender_name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {msg.formattedDate}
                    </span>
                  </div>
                  {msg.content && (
                    <p className="mt-1 truncate text-muted-foreground text-xs">
                      {msg.content}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Date Range Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label
            htmlFor="start-date"
            className="mb-1 block text-muted-foreground text-xs"
          >
            Start Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="end-date"
            className="mb-1 block text-muted-foreground text-xs"
          >
            End Date
          </label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
        </div>
        {(startDate || endDate) && (
          <div className="flex items-end">
            <Button variant="outline" size="icon" onClick={handleClearDates}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {(searchTerm || startDate || endDate) && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
          <p className="text-sm">
            Showing{" "}
            <span className="font-medium">{filteredMessages.length}</span> of{" "}
            <span className="font-medium">{messages.length}</span> messages
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleClearSearch();
              handleClearDates();
            }}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
