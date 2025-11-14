import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { FolderStructure, Message } from "@/lib/messageUtils";
import { getMessageGroupPosition } from "@/lib/messageUtils";
import { MessageBubble } from "./message-bubble";

interface VirtualMessageListProps {
  messages: Message[];
  selectedMessageId?: string | null;
  mainUser?: string | null;
  folderStructure?: FolderStructure | null;
  containerHeight?: number;
  itemHeight?: number;
  bufferSize?: number;
}

export function VirtualMessageList({
  messages,
  selectedMessageId,
  mainUser,
  folderStructure,
  itemHeight = 100,
  bufferSize = 5,
}: VirtualMessageListProps) {
  const scrollParentRef = useRef<HTMLDivElement>(null);

  // Virtualizer with dynamic measurement. estimateSize is a fallback; actual heights are measured.
  const virtualizer = useVirtualizer({
    gap: 2,
    count: messages.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => itemHeight,
    overscan: bufferSize,
  });

  // Scroll to the selected message index and center it.
  useEffect(() => {
    if (!selectedMessageId) return;
    const index = messages.findIndex((m) => m.id === selectedMessageId);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "center" });
    }
  }, [selectedMessageId, messages, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={scrollParentRef}
      className="relative h-full overflow-y-scroll border px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2"
    >
      <div className="relative w-full" style={{ height: totalSize }}>
        {virtualItems.map((item) => {
          const message = messages[item.index];
          const previousMessage =
            item.index > 0 ? messages[item.index - 1] : null;
          const nextMessage =
            item.index < messages.length - 1 ? messages[item.index + 1] : null;
          const groupPosition = getMessageGroupPosition(
            previousMessage,
            message,
            nextMessage,
          );

          return (
            <div
              key={message.id}
              ref={virtualizer.measureElement}
              data-index={item.index}
              className="absolute top-0 left-0 w-full will-change-transform"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <MessageBubble
                message={message}
                groupPosition={groupPosition}
                isSelected={message.id === selectedMessageId}
                isMainUser={mainUser === message.sender_name}
                folderStructure={folderStructure}
              />
            </div>
          );
        })}
      </div>
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>No messages to display</p>
        </div>
      )}
    </div>
  );
}
