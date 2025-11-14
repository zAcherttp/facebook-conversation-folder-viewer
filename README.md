# Facebook Messenger Archive Viewer

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/fb-json-message-viewer)

A client-side web application for viewing and exploring Facebook Messenger chat archives from GDPR data exports. Designed to handle large conversations (200k+ messages) with high performance using virtual scrolling and optimized rendering.

## ✨ Features

- **📁 Local-First** - All processing happens in your browser, no server uploads
- **⚡ High Performance** - Virtual scrolling handles 100k+ messages smoothly
- **🔍 Searching** - Full-text search with whole-word matching
- **📅 Date Filtering** - Filter messages by custom date ranges
- **🖼️ Media Preview** - View photos and attachments with extra-lazy loading
- **👥 Multi-User View** - Switch perspective between conversation participants
- **🎯 Jump to Message** - Search results link directly to messages

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

```bash
# Clone the repository
git clone https://github.com/zAcherttp/facebook-conversation-folder-viewer.git
cd message-viewer

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📖 How to Use

### 1. [Export a copy of your Facebook information](https://www.facebook.com/help/212802592074644/?helpref=uf_share)

### 2. Load Your Conversation

#### Option A: Upload Folder

- Click "Select Conversation Folder"
- Navigate to `your_facebook_activity/messages/inbox/<conversation_name>/`
- Select the folder containing `message_*.json` files

#### Option B: Try Demo

- Click "Load Demo Chat" to explore with sample data

### 3. Explore Your Messages

- **Search**: Type in search bar, use whole-word toggle for exact matches
- **Filter by Date**: Click calendar icon to select date range
- **Switch User View**: Use dropdown to see messages from different perspectives
- **View Media**: Click on images to load temporarily

## 📂 Expected Folder Structure

```txt
your_facebook_activity/messages/inbox/<chat_name>/
├── message_1.json       # Main message data (~3MB)
├── message_2.json
├── ...
├── photos/              # Image attachments
├── videos/              # Video attachments
├── audio/               # Voice messages
├── gifs/                # GIF attachments
└── files/               # Document attachments
```

## 🛠️ Tech Stack

- **React + TypeScript** - UI framework with type safety
- **TanStack Start + Router** - File-based routing with SSR support
- **TanStack Virtual** - Virtual scrolling for 50k+ messages
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Framer Motion** - Smooth animations
- **Biome** - Fast linting and formatting
- **Turborepo** - Monorepo build system
- **Bun** - Fast JavaScript runtime

## 📁 Project Structure

```
message-viewer/
├── apps/
│   └── web/                          # Main application
│       ├── src/
│       │   ├── routes/               # File-based routes
│       │   │   ├── __root.tsx        # Root layout with theme provider
│       │   │   └── index.tsx         # Main chat viewer page
│       │   ├── components/
│       │   │   ├── virtual-message-list.tsx  # Virtual scrolling
│       │   │   ├── message-bubble.tsx        # Message rendering
│       │   │   ├── search-bar.tsx            # Search with command palette
│       │   │   ├── date-filters.tsx          # Date range picker
│       │   │   └── folder-upload.tsx         # Folder selection
│       │   └── lib/
│       │       └── messageUtils.ts   # Core processing logic
│       └── public/
│           └── demo-chat/            # Demo conversation data
└── packages/
    └── config/                       # Shared TypeScript configs
```

## 🧠 Key Features Explained

### Chunked File Reading

Large `message_*.json` files (~3MB) are read in 512KB chunks to prevent browser freezing.

### Encoding Fix

Facebook exports use Latin-1 encoding. The app automatically converts to UTF-8 for proper display of special characters (e.g., Vietnamese, emoji).

### Virtual Scrolling

Only renders ~20 visible messages at a time, reducing DOM nodes by 99.8% for large conversations.

### Lazy Media Loading

Image blob URLs are created only when you click "Load Image", preventing memory issues with 100+ photos.

## 📜 Available Scripts

```bash
bun run dev          # Start dev server (http://localhost:3001)
bun run dev:web      # Start web app only
bun run build        # Production build
bun run check        # Lint + format with Biome
bun run check-types  # TypeScript validation
```

## 🐛 Known Limitations

- **Client-side only** - Requires modern browser with File System Access API
- **Media preview** - Photos only (video/audio playback not yet implemented)
- **Search limit** - Shows top 50 results for performance

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Note**: This app processes all data locally in your browser. No data is uploaded to any server.
