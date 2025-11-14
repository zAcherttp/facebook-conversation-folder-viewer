import {
  CheckIcon,
  CopyIcon,
  FileIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/messageUtils";
import { cleanAttachmentPath } from "@/lib/messageUtils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type MessageBubbleGroupPosition = "single" | "first" | "middle" | "last";

interface MessageBubbleProps {
  message: Message;
  groupPosition?: MessageBubbleGroupPosition;
  isSelected?: boolean;
  isMainUser?: boolean;
}

export function MessageBubble({
  message,
  groupPosition = "single",
  isSelected,
  isMainUser = false,
}: MessageBubbleProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const copyToClipboard = async (uri: string) => {
    const cleanPath = cleanAttachmentPath(uri);
    try {
      await navigator.clipboard.writeText(cleanPath);
      setCopiedPath(uri);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const hasAttachments =
    (message.photos && message.photos.length > 0) ||
    (message.videos && message.videos.length > 0) ||
    (message.audio_files && message.audio_files.length > 0) ||
    (message.files && message.files.length > 0) ||
    (message.gifs && message.gifs.length > 0);

  // Apply different border radius based on group position
  const getBubbleRadius = () => {
    if (groupPosition === "single") return "rounded-xl";
    if (groupPosition === "first") {
      return isMainUser
        ? "rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm"
        : "rounded-tl-xl rounded-tr-xl rounded-bl-sm rounded-br-xl";
    }
    if (groupPosition === "last") {
      return isMainUser
        ? "rounded-tl-xl rounded-tr-sm rounded-bl-xl rounded-br-xl"
        : "rounded-tl-sm rounded-tr-xl rounded-bl-xl rounded-br-xl";
    }
    // middle
    return isMainUser
      ? "rounded-tl-xl rounded-tr-sm rounded-bl-xl rounded-br-sm"
      : "rounded-tl-sm rounded-tr-xl rounded-bl-sm rounded-br-xl";
  };

  // Adjust spacing based on group position
  const getSpacing = () => {
    if (groupPosition === "single" || groupPosition === "last") return "mb-2";
    return "mb-0";
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        getSpacing(),
        isMainUser ? "items-end" : "items-start",
      )}
    >
      {/* Only show sender name for single or first message in group */}
      {(groupPosition === "single" || groupPosition === "first") && (
        <span className="px-3 font-light text-muted-foreground text-xs">
          {message.sender_name}
        </span>
      )}
      <div
        className={cn(
          "border p-3 transition-all",
          getBubbleRadius(),
          isSelected && "ring-2 ring-blue-500",
          isMainUser ? "ml-auto bg-blue-600/80 text-white" : "bg-card",
        )}
      >
        {/* Message Content */}
        {message.content && (
          <p className="wrap-break-words whitespace-pre-wrap text-sm">
            {message.content}
          </p>
        )}
        {/* Unsent Message Indicator */}
        {message.is_unsent && (
          <p className="text-muted-foreground text-xs italic">
            Message was unsent
          </p>
        )}
        {/* Shared Link */}
        {message.share?.link && (
          <div className="mt-2 rounded border bg-muted/50 p-2">
            <a
              href={message.share.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs hover:underline"
            >
              {message.share.link}
            </a>
            {message.share.share_text && (
              <p className="mt-1 text-muted-foreground text-xs">
                {message.share.share_text}
              </p>
            )}
          </div>
        )}
        {/* Call Duration */}
        {message.call_duration !== undefined && (
          <p className="mt-2 text-muted-foreground text-xs">
            📞 Call duration: {Math.floor(message.call_duration / 60)}:
            {String(message.call_duration % 60).padStart(2, "0")}
          </p>
        )}
        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Photos */}
            {message.photos?.map((photo, idx) => (
              <Button
                key={`photo-${photo.creation_timestamp}`}
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 py-1.5"
                onClick={() => copyToClipboard(photo.uri)}
              >
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  <span className="text-xs">Photo {idx + 1}</span>
                  {copiedPath === photo.uri ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}

            {/* Videos */}
            {message.videos?.map((video, idx) => (
              <Button
                key={`video-${video.creation_timestamp}`}
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 py-1.5"
                onClick={() => copyToClipboard(video.uri)}
              >
                <div className="flex items-center gap-1">
                  <VideoIcon className="h-3 w-3" />
                  <span className="text-xs">Video {idx + 1}</span>
                  {copiedPath === video.uri ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}

            {/* Audio Files */}
            {message.audio_files?.map((audio, idx) => (
              <Button
                key={`audio-${audio.creation_timestamp}`}
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 py-1.5"
                onClick={() => copyToClipboard(audio.uri)}
              >
                <div className="flex items-center gap-1">
                  <MusicIcon className="h-3 w-3" />
                  <span className="text-xs">Audio {idx + 1}</span>
                  {copiedPath === audio.uri ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}

            {/* Files */}
            {message.files?.map((file, idx) => (
              <Button
                key={`file-${file.creation_timestamp}`}
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 py-1.5"
                onClick={() => copyToClipboard(file.uri)}
              >
                <div className="flex items-center gap-1">
                  <FileIcon className="h-3 w-3" />
                  <span className="text-xs">File {idx + 1}</span>
                  {copiedPath === file.uri ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}

            {/* GIFs */}
            {message.gifs?.map((gif, idx) => (
              <Button
                key={`gif-${gif.uri}`}
                variant="outline"
                size="sm"
                className="h-auto flex-col items-start gap-1 py-1.5"
                onClick={() => copyToClipboard(gif.uri)}
              >
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  <span className="text-xs">GIF {idx + 1}</span>
                  {copiedPath === gif.uri ? (
                    <CheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <CopyIcon className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <Tooltip key={reaction.actor}>
                <TooltipTrigger className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {reaction.reaction}
                </TooltipTrigger>
                <TooltipContent>{reaction.actor}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
