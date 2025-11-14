import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FolderUpload } from "@/components/folder-upload";
import { SearchBar } from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualMessageList } from "@/components/virtual-message-list";
import {
  extractParticipants,
  loadDemoChat,
  type Message,
  processMessageFiles,
} from "@/lib/messageUtils";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [chatFolder, setChatFolder] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [mainUser, setMainUser] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  const handleFolderSelected = async (files: File[], folder: string) => {
    setIsProcessing(true);
    setChatFolder(folder);
    setMessages([]);
    setFilteredMessages([]);
    setProgress({ current: 0, total: 0 });

    try {
      // Build folder structure for future media preview
      // const structure = buildFolderStructure(files);
      // setFolderStructure(structure);

      // Process message files
      toast.info("Processing message files...");
      const processedMessages = await processMessageFiles(
        files,
        (current, total) => {
          setProgress({ current, total });
        },
      );

      setMessages(processedMessages);
      setFilteredMessages(processedMessages);

      // Extract participants and set first as main user
      const participantsList = extractParticipants(processedMessages);
      setParticipants(participantsList);
      if (participantsList.length > 0) {
        setMainUser(participantsList[0]);
      }

      toast.success(
        `Successfully loaded ${processedMessages.length} messages from ${folder}`,
      );
    } catch (error) {
      toast.error(
        `Failed to process messages: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoLoad = async () => {
    setIsProcessing(true);
    setChatFolder("Demo Chat - Movie Night Squad");
    setMessages([]);
    setFilteredMessages([]);

    try {
      toast.info("Loading demo chat...");
      const demoMessages = await loadDemoChat();

      setMessages(demoMessages);
      setFilteredMessages(demoMessages);

      // Extract participants and set first as main user
      const participantsList = extractParticipants(demoMessages);
      setParticipants(participantsList);
      if (participantsList.length > 0) {
        setMainUser(participantsList[0]);
      }

      toast.success(
        `Successfully loaded ${demoMessages.length} demo messages with ${participantsList.length} participants`,
      );
    } catch (error) {
      toast.error(
        `Failed to load demo: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterChange = useCallback((filtered: Message[]) => {
    setFilteredMessages(filtered);
  }, []);

  const handleMessageSelect = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
    // Clear selection after 3 seconds
    setTimeout(() => setSelectedMessageId(null), 3000);
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-3xl">
          Facebook Messenger Archive Viewer
        </h1>
        <p className="text-muted-foreground">
          View and search your Facebook Messenger chat history with support for
          large archives
        </p>
      </div>
      {/* Upload Section */}
      {!chatFolder && (
        <FolderUpload
          onFolderSelected={handleFolderSelected}
          onDemoLoad={handleDemoLoad}
          isProcessing={isProcessing}
        />
      )}{" "}
      {/* Processing Progress */}
      {isProcessing && progress.total > 0 && (
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Processing message files: {progress.current} / {progress.total}
            </p>
            <span className="text-muted-foreground text-sm">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          {/* biome-ignore lint/nursery/useStrictCSSInJSAttributes: Dynamic progress percentage */}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </Card>
      )}
      {/* Viewer Section */}
      {chatFolder && messages.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-xl">{chatFolder}</h2>
                <p className="text-muted-foreground text-sm">
                  {messages.length} messages loaded
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="user-select"
                  className="text-muted-foreground text-sm"
                >
                  View as:
                </label>
                <Select
                  value={mainUser || undefined}
                  onValueChange={setMainUser}
                >
                  <SelectTrigger id="user-select" className="w-48">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant} value={participant}>
                        {participant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Search and Filters */}
          <SearchBar
            messages={messages}
            onMessageSelect={handleMessageSelect}
            onFilterChange={handleFilterChange}
          />

          {/* Virtual Message List */}
          <VirtualMessageList
            messages={filteredMessages}
            selectedMessageId={selectedMessageId}
            mainUser={mainUser}
            containerHeight={600}
          />
        </div>
      )}
    </div>
  );
}
