import { Image } from "@unpic/react";
import {
  CheckIcon,
  CopyIcon,
  FileIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FolderStructure, Message } from "@/lib/messageUtils";
import {
  cleanAttachmentPath,
  copyToClipboard,
  getMessageBubbleRadius,
  getMessageBubbleSpacing,
  isMessageWithAttachments,
  type MessageBubbleGroupPosition,
} from "@/lib/messageUtils";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface MessageBubbleProps {
  message: Message;
  groupPosition?: MessageBubbleGroupPosition;
  isSelected?: boolean;
  isMainUser?: boolean;
  folderStructure?: FolderStructure | null;
}

export function MessageBubble({
  message,
  groupPosition = "single",
  isSelected,
  isMainUser = false,
  folderStructure,
}: MessageBubbleProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const copyUriToClipboard = async (uri: string) => {
    const cleanPath = cleanAttachmentPath(uri);
    copyToClipboard(cleanPath);
    setCopiedPath(uri);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const loadImage = (uri: string) => {
    setLoadedImages((prev) => new Set(prev).add(uri));
  };

  // Create blob URLs only for loaded images
  const blobUrls = useMemo(() => {
    const urls: Record<string, string> = {};

    if (!folderStructure) return urls;

    // Process photos - only create blob URLs for loaded images
    message.photos?.forEach((photo) => {
      if (!loadedImages.has(photo.uri)) return;
      const fileName = photo.uri.split("/").pop();
      if (fileName && folderStructure.photos[fileName]) {
        urls[photo.uri] = URL.createObjectURL(folderStructure.photos[fileName]);
      }
    });

    // Process videos - only create blob URLs for loaded videos
    message.videos?.forEach((video) => {
      if (!loadedImages.has(video.uri)) return;
      const fileName = video.uri.split("/").pop();
      if (fileName && folderStructure.videos[fileName]) {
        urls[video.uri] = URL.createObjectURL(folderStructure.videos[fileName]);
      }
    });

    // Process GIFs - only create blob URLs for loaded GIFs
    message.gifs?.forEach((gif) => {
      if (!loadedImages.has(gif.uri)) return;
      const fileName = gif.uri.split("/").pop();
      if (fileName && folderStructure.gifs[fileName]) {
        urls[gif.uri] = URL.createObjectURL(folderStructure.gifs[fileName]);
      }
    });

    return urls;
  }, [
    folderStructure,
    loadedImages,
    message.photos,
    message.videos,
    message.gifs,
  ]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [blobUrls]);

  const messageAttachmentProps = {
    variant: "outline",
    size: "sm",
    className:
      "rounded-sm h-auto flex-col items-start gap-1 py-1.5 text-secondary-foreground",
  } as const;

  const messageBadgeProps = {
    className: "border border-primary/25 rounded-sm",
    variant: "secondary",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col",
        getMessageBubbleSpacing(groupPosition),
        isMainUser ? "items-end" : "items-start",
      )}
    >
      {/* Only show sender name for single or first message in group */}
      {(groupPosition === "single" || groupPosition === "first") && (
        <span className="px-3 font-normal text-muted-foreground text-xs">
          {message.sender_name}
        </span>
      )}
      <div
        className={cn(
          "flex max-w-3/4 flex-col gap-2 p-3",
          getMessageBubbleRadius(groupPosition, isMainUser),
          isSelected && "ring-2 ring-blue-500",
          isMainUser
            ? "ml-auto bg-primary/90 text-primary-foreground"
            : "bg-primary/10",
        )}
      >
        {/* Message Content */}
        {message.content && (
          <p className="wrap-break-word whitespace-pre-wrap text-sm">
            {message.content}
          </p>
        )}
        {/* Unsent Message Indicator */}
        {message.is_unsent && (
          <p className="text-muted-foreground text-sm italic">
            {isMainUser
              ? "You unsent a message"
              : `${message.sender_name} unsent a message`}
          </p>
        )}
        {/* Shared Link */}
        {message.share?.link && (
          <div className="rounded border bg-muted/50 px-2 pb-1">
            <a
              href={message.share.link}
              target="_blank"
              rel="noopener noreferrer"
              className="wrap-anywhere text-secondary-foreground text-xs hover:underline"
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
          <Badge {...messageBadgeProps}>
            📞 Call duration: {Math.floor(message.call_duration / 60)}:
            {String(message.call_duration % 60).padStart(2, "0")}
          </Badge>
        )}
        {/* Attachments */}
        {isMessageWithAttachments(message) && (
          <div className="flex flex-wrap gap-2">
            {/* Photos */}
            {message.photos?.map((photo, idx) => {
              const isLoaded = loadedImages.has(photo.uri);
              const blobUrl = isLoaded ? blobUrls[photo.uri] : null;
              const canLoadImage = !!folderStructure;

              return (
                <Button
                  key={`photo-${photo.creation_timestamp}`}
                  variant="outline"
                  size="sm"
                  className="h-auto w-auto flex-col items-start gap-1 p-1"
                  onClick={() => {
                    if (!isLoaded && canLoadImage) {
                      loadImage(photo.uri);
                    } else if (isLoaded || !canLoadImage) {
                      copyUriToClipboard(photo.uri);
                    }
                  }}
                >
                  <motion.div
                    layout
                    animate={{
                      opacity: isLoaded ? 1 : 0.5,
                      scale: isLoaded ? 1 : 0.95,
                    }}
                    transition={{
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 },
                      layout: { duration: 0.3 },
                    }}
                    className="flex h-[400px] w-[400px] items-center justify-center"
                  >
                    {blobUrl ? (
                      <Image
                        src={blobUrl}
                        alt={`Attachment ${idx + 1}`}
                        layout="constrained"
                        width={400}
                        height={400}
                        className="h-auto max-h-[400px] w-auto max-w-[400px] rounded object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded bg-muted/10">
                        {!canLoadImage && (
                          <span className="text-muted-foreground text-xs">
                            No preview
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                  <div className="flex w-full items-center justify-center gap-2">
                    <span className="text-xs">
                      {canLoadImage && !isLoaded ? "Click to Load" : ""}
                    </span>
                    {isLoaded &&
                      (copiedPath === photo.uri ? (
                        <CheckIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <CopyIcon className="h-3 w-3" />
                      ))}
                  </div>
                </Button>
              );
            })}

            {/* Videos */}
            {message.videos?.map((video, idx) => (
              <Button
                key={`video-${video.creation_timestamp}`}
                {...messageAttachmentProps}
                onClick={() => copyUriToClipboard(video.uri)}
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
                {...messageAttachmentProps}
                onClick={() => copyUriToClipboard(audio.uri)}
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
                {...messageAttachmentProps}
                onClick={() => copyUriToClipboard(file.uri)}
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
                {...messageAttachmentProps}
                onClick={() => copyUriToClipboard(gif.uri)}
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
          <div className="flex flex-wrap gap-1">
            {(() => {
              // Group reactions by emoji
              const reactionGroups = message.reactions.reduce(
                (acc, reaction) => {
                  if (!acc[reaction.reaction]) {
                    acc[reaction.reaction] = [];
                  }
                  acc[reaction.reaction].push(reaction.actor);
                  return acc;
                },
                {} as Record<string, string[]>,
              );

              return Object.entries(reactionGroups).map(([emoji, actors]) => {
                const NUM_ACTORS_SHOWN = 3;
                const count = actors.length;
                const displayActors =
                  actors.length > NUM_ACTORS_SHOWN
                    ? `${actors.slice(0, NUM_ACTORS_SHOWN).join(", ")}, and ${actors.length - NUM_ACTORS_SHOWN}+ more`
                    : actors.join(", ");

                return (
                  <Tooltip key={emoji}>
                    <TooltipTrigger asChild>
                      <Badge {...messageBadgeProps}>
                        {count > 1 && `${count} `}
                        {emoji}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{displayActors}</TooltipContent>
                  </Tooltip>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
