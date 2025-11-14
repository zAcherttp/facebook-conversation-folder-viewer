import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DateFilters } from "@/components/date-filters";
import { FolderUpload } from "@/components/folder-upload";
import { SearchBar } from "@/components/search-bar";
import ThemeToggle from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualMessageList } from "@/components/virtual-message-list";
import {
  buildFolderStructure,
  extractParticipants,
  type FolderStructure,
  loadDemoChat,
  type Message,
  processMessageFiles,
} from "@/lib/messageUtils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MessageCircleDashed } from "lucide-react";

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
  const [folderStructure, setFolderStructure] =
    useState<FolderStructure | null>(null);

  const handleFolderSelected = async (files: File[], folder: string) => {
    setIsProcessing(true);
    setChatFolder(folder);
    setMessages([]);
    setFolderStructure(null);
    setProgress({ current: 0, total: 0 });

    const toastId = toast.loading("Building folder structure...");

    try {
      // Build folder structure for media preview
      const structure = buildFolderStructure(files);
      setFolderStructure(structure);

      // Process message files
      toast.loading("Processing message files...", { id: toastId });
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
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        `Failed to process messages: ${error instanceof Error ? error.message : "Unknown error"}`,
        { id: toastId },
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

    const toastId = toast.loading("Loading demo chat...");

    try {
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
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        `Failed to load demo: ${error instanceof Error ? error.message : "Unknown error"}`,
        { id: toastId },
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
    <ResizablePanelGroup direction="horizontal" className="max-h-svh min-h-svh">
      {/* Left Panel - Folder Operations */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <div className="h-full overflow-y-auto p-4">
          <FolderUpload
            onFolderSelected={handleFolderSelected}
            onDemoLoad={handleDemoLoad}
            isProcessing={isProcessing}
          />

          {/* Processing Progress */}
          {isProcessing && progress.total > 0 && (
            <Card className="mt-4 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Processing: {progress.current} / {progress.total}
                </p>
                <span className="text-muted-foreground text-sm">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <Progress
                  className="h-full"
                  value={(progress.current / progress.total) * 100}
                />
              </div>
            </Card>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Middle Panel - Chat View */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="flex h-full flex-col">
          {chatFolder && messages.length > 0 ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="font-semibold text-xl">{chatFolder}</h2>
                  <p className="text-muted-foreground text-sm">
                    {filteredMessages.length} of {messages.length} messages
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

              {/* Message List */}
              <div className="flex-1 overflow-hidden">
                <VirtualMessageList
                  messages={filteredMessages}
                  selectedMessageId={selectedMessageId}
                  mainUser={mainUser}
                  folderStructure={folderStructure}
                  containerHeight={0}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleDashed />
                  </EmptyMedia>
                  <EmptyTitle>No Conversation Loaded</EmptyTitle>
                  <EmptyDescription>
                    Select a Facebook Messenger export folder or load the demo
                    chat to get started viewing your messages.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Right Panel - Search & Filters */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <div className="h-full overflow-y-auto p-4">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-sm">Search Messages</h3>
              <SearchBar
                messages={messages}
                onMessageSelect={handleMessageSelect}
              />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-sm">Filter by Date</h3>
              <DateFilters
                messages={messages}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
