## AI Coding Agent Guide — Facebook Messenger Archive Viewer

**Purpose:** Client-side web app for viewing Facebook Messenger chat archives exported via GDPR data download. Handles 10k–50k+ messages with chunked reading, virtual scrolling, search/filtering, and attachment path management.

**Tech Stack:** Bun + Turborepo monorepo | React + TanStack Start + Vite | Tailwind 4 + shadcn/ui | Biome for linting/formatting.

---

### 📂 Expected Facebook Export Folder Structure
```
your_facebook_activity/messages/{inbox|archived_threads|e2ee_cutover}/
  <chatname>_<id>/
    ├── message_1.json       # Messages array, may be 5–10MB+
    ├── message_2.json
    ├── ...
    ├── photos/
    ├── videos/
    ├── audio/
    ├── gifs/
    └── files/
```
**Message JSON Structure:**
```json
{
  "messages": [
    {
      "sender_name": "Hoàng Phúc",  // Latin-1 encoding, needs fixEncoding()
      "timestamp_ms": 1716390801594,
      "content": "Message text...",
      "photos": [{"uri": "your_facebook_activity/messages/.../photos/img.jpg"}],
      "videos": [{"uri": "..."}],
      "audio_files": [{"uri": "..."}],
      "files": [{"uri": "..."}]
    }
  ]
}
```

---

### 🏗️ Core Architecture & Data Flow

**1. Folder Upload → Validation (`validateFolder`)**
- User selects folder via `<input type="file" webkitdirectory />`
- Must contain: `message_*.json` + at least one media folder (`photos/`, `videos/`, etc.)
- Extract chat folder name (e.g., `hoangphuctrannguyen_1214335819071355`)
- Show specific error if validation fails

**2. Message Processing Pipeline (`processMessageFiles`)**
```javascript
// Critical 5-step pipeline:
① File Discovery → Find all message_*.json, sort numerically
② Chunked Reading → Read 512KB chunks to prevent UI freeze (see below)
③ Encoding Fix → Latin-1 → UTF-8: decodeURIComponent(escape(str))
④ Enrichment → Add unique ID, parse timestamps, format dates
⑤ Aggregation → Merge all files, sort by timestamp_ms chronologically
```

**3. Rendering with Virtual List**
- Only renders ~15–20 messages visible in 600px viewport (+ 5-item buffer)
- `itemHeight: 120px`, calculates `startIndex`/`endIndex` from `scrollTop`
- Container height = `messages.length * 120px` for scroll physics
- 99.8% reduction in DOM nodes for 10k+ messages

---

### ⚡ Critical Performance Patterns

#### **Chunked JSON Reading (5MB+ files)**
```javascript
// Located in: readJsonInChunks(file)
const CHUNK_SIZE = 512 * 1024; // 512KB prevents browser freeze
let text = '';
for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
  const chunk = file.slice(offset, offset + CHUNK_SIZE);
  text += await chunk.text(); // Non-blocking
}
return JSON.parse(text); // Parse once after concatenation
```
**When to use:** All `message_*.json` files (they can be 5–10MB each).

#### **Encoding Fix (Vietnamese/Special Characters)**
```javascript
// Facebook exports use Latin-1; need UTF-8
const fixEncoding = (str) => {
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str; // Fallback if already UTF-8
  }
};
// Apply to: sender_name, content, any text fields
```

#### **Virtual Scrolling**
```javascript
// In: VirtualMessageList component
const startIndex = Math.max(0, Math.floor(scrollTop / 120) - 5);
const endIndex = Math.min(messages.length, startIndex + Math.ceil(600 / 120) + 10);
const visibleMessages = filteredMessages.slice(startIndex, endIndex);
const offsetY = startIndex * 120; // Position rendered slice
```

---

### 🔍 Search & Filtering Implementation

**Search Strategy:**
- Client-side: filter `messages` array by `content` or `sender_name` (case-insensitive)
- Instant results (no backend), works with 50k+ messages
- Show top 50 results in dropdown, click → `scrollToMessage(id)`

**Date Range Filter:**
- Apply after search: `timestamp_ms >= startDate && timestamp_ms <= endDate (23:59:59)`
- Combined filters work together (search AND date range)

**Jump to Message:**
```javascript
// Located in: scrollToMessage(messageId)
setSelectedMessage(messageId);
messageRefs.current[messageId]?.scrollIntoView({ 
  behavior: 'smooth', 
  block: 'center' 
});
// Apply highlight: ring-2 ring-blue-500 for 2s
```

---

### 📎 Attachment Handling

**Path Processing:**
- Facebook URIs: `your_facebook_activity/messages/e2ee_cutover/<chat>/photos/img.jpg`
- Clean for user: Remove first 3 parts → `<chat>/photos/img.jpg`
- Copy to clipboard via `navigator.clipboard.writeText(cleanPath)`
- Show visual confirmation (toast/icon change) for 2s

**Attachment Types:**
- `photos[]` → Image icon
- `videos[]` → Video icon
- `audio_files[]` → Music icon
- `files[]` → File icon

**Future Enhancement (not yet implemented):**
```javascript
// Build folder structure map on upload for media preview
const folderStructure = {
  photos: { "img.jpg": File },
  videos: { "clip.mp4": File }
};
// Later: Preview inline with URL.createObjectURL(folderStructure.photos["img.jpg"])
```

---

### 🧠 Memory Management

**What's Stored:**
- ✅ All message objects (~1KB each): 50k messages ≈ 50MB
- ✅ Folder structure map (file references only, not binary data)
- ✅ Filtered messages (references to original array, not copies)

**What's NOT Stored:**
- ❌ Full file contents after parsing (read → parse → discard)
- ❌ Media file binary data (only paths/references)
- ❌ Non-visible DOM elements (virtual list)

**Garbage Collection:**
```javascript
// On new folder upload:
setMessages([]);        // Clear old messages
setChatFolder(null);    // Clear old folder
// Browser GC reclaims ~50–100MB
```

---

### 🎯 File-Based Routes & Key Files

**Core App Structure:**
- `apps/web/src/routes/index.tsx` → Main upload + message viewer page
- `apps/web/src/lib/messageUtils.ts` → Core utilities (chunked reading, encoding, validation)
- `apps/web/src/components/folder-upload.tsx` → Folder selection with validation
- `apps/web/src/components/search-bar.tsx` → Search input + date filters + results dropdown
- `apps/web/src/components/virtual-message-list.tsx` → Virtual scrolling container
- `apps/web/src/components/message-bubble.tsx` → Individual message rendering
- `apps/web/src/router.tsx` → Router config (uses generated `routeTree.gen.ts`)
- `apps/web/src/routes/__root.tsx` → Layout with `<Header/>`, `<Toaster/>`, dev tools
- `apps/web/src/components/ui/*` → shadcn/ui components (Button, Card, Input, etc.)
- `apps/web/src/lib/utils.ts` → `cn()` for Tailwind class merging

**Add New Route Example:**
  ```tsx
  // apps/web/src/routes/stats.tsx
  import { createFileRoute } from "@tanstack/react-router";

  export const Route = createFileRoute("/stats")({
    component: () => <div>Message Statistics</div>,
  });
  // Auto-generates into routeTree.gen.ts (DON'T edit that file)
  ```

---

### 🛠️ Dev Workflows

```pwsh
bun install           # Install deps
bun run dev           # Dev server → http://localhost:3001
bun run dev:web       # Web app only
bun run build         # Production build
bun run check         # Biome lint + format (auto-fix)
bun run check-types   # TypeScript validation
```

---

### ⚠️ Gotchas & Conventions

1. **NEVER edit `routeTree.gen.ts`** — it's auto-generated by TanStack Start plugin
2. **Chunked reading is mandatory** for `message_*.json` files (they're 5–10MB each)
3. **Virtual scrolling required** — rendering all messages will freeze the browser
4. **Encoding fix essential** — Facebook exports use Latin-1, must convert to UTF-8
5. **Path aliases:** Use `@/components/...` not relative `../../components/...`
6. **Biome enforces sorted Tailwind classes** — use `cn()` from `@/lib/utils`
7. **Port 3001** for dev server (see `apps/web/package.json`)
8. **Client-side only** — no backend, uses File System Access API for folder upload
9. **Inline styles for dynamic values** — Add `biome-ignore` comment for progress bars, virtual scroll positioning

---

### 🚀 Quick Task Recipes

**Add Statistics Dashboard:**
```tsx
// apps/web/src/routes/stats.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats")({
  component: () => {
    // Access messages from global state or pass via router context
    return <div>Messages per day chart...</div>;
  }
});
```

**Add Media Preview Modal:**
```javascript
// In message bubble component:
const [previewMedia, setPreviewMedia] = useState(null);
const handlePhotoClick = (photoUri) => {
  const file = folderStructure.photos[photoUri.split('/').pop()];
  setPreviewMedia(URL.createObjectURL(file));
};
// Render: <img src={previewMedia} />
```

**Export Filtered Messages:**
```javascript
const exportMessages = () => {
  const json = JSON.stringify(filteredMessages, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filtered_${chatFolder}_${Date.now()}.json`;
  a.click();
};
```

---

**Need help with:** Testing strategy, deployment setup, or extending features? Ask and I'll update these instructions with project-specific patterns.
