/**
 * Utility functions for processing Facebook Messenger archive data
 */

export type Attachment = {
  uri: string;
  creation_timestamp?: number;
};

export type MessageReaction = {
  reaction: string;
  actor: string;
};

export type MessageSharable = {
  link?: string;
  share_text?: string;
};

export type MessageParticipant = {
  name: string;
};

export interface Message {
  id: string;
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  photos?: Attachment[];
  videos?: Attachment[];
  audio_files?: Attachment[];
  files?: Attachment[];
  gifs?: Attachment[];
  reactions?: MessageReaction[];
  share?: MessageSharable;
  call_duration?: number;
  is_unsent?: boolean;
  formattedDate?: string;
  formattedTime?: string;
}
export function isMessageWithAttachments(message: Message): boolean {
  const ATTACHMENT_KEYS: (keyof Message)[] = [
    "photos",
    "videos",
    "audio_files",
    "files",
    "gifs",
  ];

  return ATTACHMENT_KEYS.some((key) => {
    const value = message[key];
    return Array.isArray(value) && value.length > 0;
  });
}

export interface FacebookMessageFile {
  messages: Omit<Message, "id" | "formattedDate" | "formattedTime">[];
  participants?: MessageParticipant[];
  title?: string;
  thread_path?: string;
}

export interface FolderStructure {
  audio: Record<string, File>;
  files: Record<string, File>;
  gifs: Record<string, File>;
  photos: Record<string, File>;
  videos: Record<string, File>;
}

export type MessageBubbleGroupPosition = "single" | "first" | "middle" | "last";

/**
 * Read large JSON files in chunks to prevent browser freezing
 * @param file - The JSON file to read
 * @param chunkSize - Size of each chunk in bytes (default: 512KB)
 */
export async function readJsonInChunks<T>(
  file: File,
  chunkSize = 512 * 1024,
): Promise<T> {
  let text = "";

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    text += await chunk.text();
  }

  return JSON.parse(text) as T;
}

/**
 * Fix encoding from Latin-1 to UTF-8 for Facebook exports
 * Facebook exports use Latin-1 encoding which breaks special characters
 */
export function fixEncoding(str: string): string {
  try {
    // 1. Create a byte array from the string's character codes.
    // This effectively treats the "broken" string as latin1.
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }

    // 2. Decode that byte array as UTF-8.
    // We use { fatal: true } to ensure it throws an error
    // on invalid UTF-8, which mimics your original try/catch.
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(bytes);
  } catch {
    // 3. If decoding fails, it wasn't the expected broken encoding.
    return str; // Return original
  }
}

/**
 * Validate folder structure for Facebook Messenger export
 * @throws Error with specific message if validation fails
 */
export function validateFolder(files: FileList): {
  chatFolder: string;
  validFiles: File[];
} {
  const fileArray = Array.from(files);

  // Find message JSON files
  const messageFiles = fileArray.filter((f) =>
    /message_\d+\.json$/.test(f.name),
  );

  if (messageFiles.length === 0) {
    throw new Error(
      "No message_*.json files found. Please select a valid Facebook Messenger export folder.",
    );
  }

  // Check for media folders
  const hasMediaFolders = fileArray.some((f) => {
    const pathParts = f.webkitRelativePath.split("/");
    return (
      pathParts.length > 1 &&
      ["audio", "files", "gifs", "photos", "videos"].includes(
        pathParts[pathParts.length - 2],
      )
    );
  });

  if (!hasMediaFolders) {
    throw new Error(
      "No media folders (photos, videos, audio, gifs, files) found. Please select the complete chat folder.",
    );
  }

  // Extract chat folder name from first message file path
  const firstMessagePath = messageFiles[0].webkitRelativePath;
  const pathParts = firstMessagePath.split("/");
  const chatFolder = pathParts[pathParts.length - 2];

  if (!chatFolder) {
    throw new Error(
      "Could not determine chat folder name from file structure.",
    );
  }

  return { chatFolder, validFiles: fileArray };
}

/**
 * Build folder structure mapping for media files
 * Enables future media preview functionality
 */
export function buildFolderStructure(files: File[]): FolderStructure {
  const structure: FolderStructure = {
    audio: {},
    files: {},
    gifs: {},
    photos: {},
    videos: {},
  };

  for (const file of files) {
    const pathParts = file.webkitRelativePath.split("/");
    if (pathParts.length < 2) continue;

    const folderName = pathParts[pathParts.length - 2];
    const fileName = pathParts[pathParts.length - 1];

    if (folderName in structure) {
      structure[folderName as keyof FolderStructure][fileName] = file;
    }
  }

  return structure;
}

/**
 * Process message files: read, parse, enrich, and aggregate
 * @param files - Array of message_*.json files
 * @param onProgress - Optional callback for progress updates
 */
export async function processMessageFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void,
): Promise<Message[]> {
  // Step 1: Sort message files by number
  const sortedFiles = files
    .filter((f) => /message_\d+\.json$/.test(f.name))
    .sort((a, b) => {
      const numA = Number.parseInt(a.name.match(/\d+/)?.[0] || "0", 10);
      const numB = Number.parseInt(b.name.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });

  const allMessages: Message[] = [];

  // Step 2-4: Read, parse, and enrich messages
  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    onProgress?.(i + 1, sortedFiles.length);

    try {
      // Chunked reading
      const data = await readJsonInChunks<FacebookMessageFile>(file);

      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn(`No messages array in ${file.name}`);
        continue;
      }

      // Enrich messages
      const enrichedMessages = data.messages.map((msg, index) => {
        const date = new Date(msg.timestamp_ms);

        return {
          ...msg,
          id: `${file.name}_${index}`,
          sender_name: fixEncoding(msg.sender_name),
          content: msg.content ? fixEncoding(msg.content) : undefined,
          reactions: msg.reactions?.map((reaction) => ({
            ...reaction,
            reaction: fixEncoding(reaction.reaction),
            actor: fixEncoding(reaction.actor),
          })),
          share: msg.share
            ? {
                link: msg.share.link ? fixEncoding(msg.share.link) : undefined,
                share_text: msg.share.share_text
                  ? fixEncoding(msg.share.share_text)
                  : undefined,
              }
            : undefined,
          formattedDate: date.toLocaleDateString(),
          formattedTime: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      allMessages.push(...enrichedMessages);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
    }
  }

  // Step 5: Sort chronologically
  allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return allMessages;
}

/**
 * Clean Facebook attachment URI for user display
 * Removes the first 3 path parts (your_facebook_activity/messages/folder_type)
 */
export function cleanAttachmentPath(uri: string): string {
  const parts = uri.split("/");
  return parts.slice(3).join("/");
}

/**
 * Format message content for display (handle long text, URLs, etc.)
 */
export function formatMessageContent(content: string, maxLength = 500): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength)}...`;
}

/**
 * Load demo chat from public folder
 */
export async function loadDemoChat(): Promise<Message[]> {
  const response = await fetch("/demo-chat/message_1.json");
  if (!response.ok) {
    throw new Error("Failed to load demo chat");
  }

  const data = (await response.json()) as FacebookMessageFile;

  if (!data.messages || !Array.isArray(data.messages)) {
    throw new Error("Invalid demo chat format");
  }

  // Enrich messages (demo data doesn't need encoding fix)
  const enrichedMessages = data.messages.map((msg, index) => {
    const date = new Date(msg.timestamp_ms);

    return {
      ...msg,
      id: `demo_${index}`,
      formattedDate: date.toLocaleDateString(),
      formattedTime: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  // Sort chronologically
  enrichedMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return enrichedMessages;
}

/**
 * Extract unique participants from messages
 */
export function extractParticipants(messages: Message[]): string[] {
  const uniqueNames = new Set(messages.map((msg) => msg.sender_name));
  return Array.from(uniqueNames).sort();
}

export function getMessageGroupPosition(
  previousMessage: Message | null,
  currentMessage: Message,
  nextMessage: Message | null,
): MessageBubbleGroupPosition {
  // single message
  if (
    (!previousMessage ||
      previousMessage.sender_name !== currentMessage.sender_name) &&
    (!nextMessage || nextMessage.sender_name !== currentMessage.sender_name)
  ) {
    return "single";
  }

  // first in group
  if (
    !previousMessage ||
    previousMessage.sender_name !== currentMessage.sender_name
  ) {
    return "first";
  }

  // last in group
  if (!nextMessage || nextMessage.sender_name !== currentMessage.sender_name) {
    return "last";
  }

  // middle in group
  return "middle";
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (
    !navigator.clipboard ||
    !navigator.clipboard.writeText ||
    text.length === 0
  ) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getMessageBubbleRadius(
  groupPosition: MessageBubbleGroupPosition,
  flip: boolean,
): string {
  if (groupPosition === "single") return "rounded-xl";
  if (groupPosition === "first") {
    return flip
      ? "rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm"
      : "rounded-tl-xl rounded-tr-xl rounded-bl-sm rounded-br-xl";
  }
  if (groupPosition === "last") {
    return flip
      ? "rounded-tl-xl rounded-tr-sm rounded-bl-xl rounded-br-xl"
      : "rounded-tl-sm rounded-tr-xl rounded-bl-xl rounded-br-xl";
  }
  // middle
  return flip
    ? "rounded-tl-xl rounded-tr-sm rounded-bl-xl rounded-br-sm"
    : "rounded-tl-sm rounded-tr-xl rounded-bl-sm rounded-br-xl";
}

export function getMessageBubbleSpacing(
  groupPosition: MessageBubbleGroupPosition,
): string {
  if (groupPosition === "single" || groupPosition === "last") return "mb-2";
  return "mb-0";
}
