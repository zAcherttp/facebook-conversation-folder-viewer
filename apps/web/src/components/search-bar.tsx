import { WholeWord } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Toggle } from "@/components/ui/toggle";
import type { Message } from "@/lib/messageUtils";

interface SearchBarProps {
  messages: Message[];
  onMessageSelect: (messageId: string) => void;
}

// Optimized search strategies for large datasets
function createSearchMatcher(term: string, matchWholeWord: boolean) {
  const trimmed = term.trim();
  if (!trimmed) return () => false;

  if (!matchWholeWord) {
    // Simple case-insensitive substring search - fast for large datasets
    const searchTerm = trimmed.toLowerCase();
    return (text: string) => (text ?? "").toLowerCase().includes(searchTerm);
  }

  // Whole word matching with word boundary regex (case-insensitive)
  const escapedTerm = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedTerm}\\b`, "i");
  return (text: string) => regex.test(text ?? "");
}

export function SearchBar({ messages, onMessageSelect }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchWholeWord, setMatchWholeWord] = useState(false);

  const searchResults = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return [];

    const matcher = createSearchMatcher(trimmed, matchWholeWord);
    const results: Message[] = [];

    // Early exit after 50 results for UI performance
    for (let i = 0; i < messages.length && results.length < 50; i++) {
      const msg = messages[i];

      // Check content first (more likely to match)
      if (msg.content && matcher(msg.content)) {
        results.push(msg);
        continue;
      }

      // Then check sender name
      if (matcher(msg.sender_name)) {
        results.push(msg);
      }
    }

    return results;
  }, [messages, searchTerm, matchWholeWord]);

  const handleResultClick = (messageId: string) => {
    onMessageSelect(messageId);
    setSearchTerm("");
  };

  return (
    <Command className="rounded-lg border" shouldFilter={false}>
      <div className="flex items-center justify-between">
        <CommandInput
          placeholder="Search messages or sender names..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="flex-1 border-0 p-0"
        />

        <Toggle
          pressed={matchWholeWord}
          onPressedChange={setMatchWholeWord}
          aria-label="Match whole word"
          size="sm"
          className="mr-0.5 h-8 w-8 p-0"
        >
          <WholeWord className="h-4 w-4" />
        </Toggle>
      </div>

      {searchResults.length > 0 && (
        <CommandList className="max-h-[400px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
          <CommandGroup
            heading={`${searchResults.length}${searchResults.length === 50 ? "+" : ""} results`}
          >
            {searchResults.map((msg) => (
              <CommandItem
                key={msg.id}
                value={msg.id}
                onSelect={() => handleResultClick(msg.id)}
                className="flex flex-col items-start gap-1"
              >
                <div className="flex w-full items-baseline justify-between gap-2">
                  <span className="font-medium text-sm">{msg.sender_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {msg.formattedDate}
                  </span>
                </div>
                {msg.content && (
                  <p className="w-full truncate text-muted-foreground text-xs">
                    {msg.content}
                  </p>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
