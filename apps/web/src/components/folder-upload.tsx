import { AlertCircleIcon, FolderIcon, Loader2Icon } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { validateFolder } from "@/lib/messageUtils";

interface FolderUploadProps {
  onFolderSelected: (files: File[], chatFolder: string) => void;
  onDemoLoad: () => void;
  isProcessing?: boolean;
}

export function FolderUpload({
  onFolderSelected,
  onDemoLoad,
  isProcessing = false,
}: FolderUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const { chatFolder, validFiles } = validateFolder(files);
      onFolderSelected(validFiles, chatFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5" />
          <h2 className="font-semibold text-lg">
            Upload Facebook Messenger Archive
          </h2>
        </div>

        <p className="text-muted-foreground text-sm">
          Select the chat folder from your Facebook data export. The folder
          should contain{" "}
          <code className="rounded bg-muted px-1">message_*.json</code> files
          and media folders (photos, videos, audio, etc.).
        </p>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            // @ts-expect-error - webkitdirectory is not in standard types
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            disabled={isProcessing}
            className="hidden"
            id="folder-input"
            aria-label="Select folder"
          />

          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FolderIcon className="mr-2 h-4 w-4" />
                Select Chat Folder
              </>
            )}
          </Button>

          <div className="relative flex items-center gap-2">
            <div className="flex-1 border-t" />
            <span className="text-muted-foreground text-xs">OR</span>
            <div className="flex-1 border-t" />
          </div>

          <Button
            onClick={onDemoLoad}
            disabled={isProcessing}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Try Demo Chat (4 participants)
          </Button>

          {error && (
            <div className="flex gap-2 rounded-lg border border-destructive bg-destructive/10 p-3">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-xs">
          <p className="mb-1 font-medium">Expected folder structure:</p>
          <pre className="text-muted-foreground">
            {`chatname_12345678/
  ├── message_1.json
  ├── message_2.json
  ├── photos/
  ├── videos/
  └── audio/`}
          </pre>
        </div>
      </div>
    </Card>
  );
}
