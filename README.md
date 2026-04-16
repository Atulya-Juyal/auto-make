# AutoMake

AutoMake is a desktop IDE-style Electron app with:

- a VS Code-like file explorer
- Monaco editor tabs with dirty state tracking
- multi-session terminal support (xterm + node-pty)
- secure API key settings (Electron `safeStorage`)
- a right AI chat sidebar with real-time LLM streaming via LangGraph

Built with Electron, React, TypeScript, Zustand, and `react-resizable-panels`.

---

## Table of Contents

- [What This App Does](#what-this-app-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [AI Sidebar Usage](#ai-sidebar-usage)
- [Packaging and Distribution](#packaging-and-distribution)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)

---

## What This App Does

AutoMake provides a desktop coding workspace with three main panes:

1. **Explorer (left)**  
   Shows workspace tree with recursive folder expansion, selection handling, and new file/folder creation.

2. **Editor + Terminal Workspace (center)**  
   Monaco-based editor tabs + integrated multi-session terminal panel.

3. **AI Assistant Sidebar (right)**  
   Chat interface with modes (`Agent`, `Plan`, `Debug`, `Ask`) and real streaming responses.

Core behaviors:

- Workspace folder can be switched via file/folder dialogs.
- Tabs support open/focus/close/reorder and unsaved indicator.
- Terminal sessions are scoped to workspace and reset on workspace switch.
- AI responses stream chunk-by-chunk into chat history.
- API keys are stored securely (OS-backed encryption), not in repo files.

---

## Tech Stack

- **Desktop shell**: Electron 39
- **Bundling**: electron-vite + Vite
- **UI**: React 19 + TypeScript
- **State**: Zustand
- **Editor**: Monaco (`@monaco-editor/react`)
- **Terminal**: xterm + node-pty
- **Panels**: react-resizable-panels (`Group`, `Panel`, `Separator`)
- **AI orchestration**:
  - `@langchain/langgraph`
  - `@langchain/core`
  - `@langchain/google-genai`
  - `@langchain/openai`
- **Formatting/Linting**: Prettier + ESLint

---

## Project Structure

```text
src/
  main/
    index.ts            # App bootstrap + window creation + handler setup
    fs.ts               # Filesystem IPC handlers
    terminal.ts         # PTY session lifecycle + terminal IPC
    secrets.ts          # Secure key storage handlers (safeStorage)
    ai.ts               # LangGraph + model streaming runtime
    dialogHandlers.ts   # Open file/folder dialogs
    windowControls.ts   # Min/max/close frameless handlers
    workspacePath.ts    # Current workspace source of truth
  preload/
    index.ts            # Safe bridge API exposed as window.api
    index.d.ts          # Renderer typings for window.api
  renderer/
    index.html
    src/
      App.tsx
      assets/main.css
      store/useAppStore.ts
      components/
        TitleBar.tsx
        FileTreeNode.tsx
        EditorTabsPane.tsx
        TerminalPane.tsx
        SidebarChat.tsx
        Settings.tsx
```

---

## How It Works

### Main process responsibilities

- Creates frameless BrowserWindow and app-level handlers.
- Owns filesystem and terminal operations.
- Owns secure key encryption/decryption.
- Owns AI execution and streaming (keys never leave main process).

### Preload bridge responsibilities

`window.api` exposes typed methods/events to renderer.  
Examples:

- file system (`readDir`, `readFile`, `writeFile`, ...)
- terminals (`terminalBootstrap`, `onTerminalData`, ...)
- secure key (`getApiKeySecure`, `setApiKeySecure`, ...)
- AI streaming (`startAiStream`, `onAiStreamChunk`, `onAiStreamEnd`, `onAiStreamError`)

### Renderer responsibilities

- Renders panes and controls.
- Maintains UI + app state in Zustand store.
- Starts AI stream requests and appends incoming chunks to chat history.

---

## Security Model

### API key storage

- Keys are stored via Electron `safeStorage` (OS-backed encryption).
- Encrypted payload is written into app user data file (`secrets.json`) as encrypted base64.
- Renderer does not need plaintext key for AI inference.

### Practical implications

- Safe to commit/push project code without losing key.
- Key is machine/user profile specific.
- If secure encryption is unavailable, behavior degrades safely (no silent plaintext storage in repo).

### UI hardening

- Saved key value is hidden in settings UI.
- Replace flow requires confirmation.
- Key input blocks copy/cut/context-menu to reduce accidental leakage.

---

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- Windows/macOS/Linux

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

---

## Available Scripts

- `npm run dev`  
  Run Electron + renderer in development mode.

- `npm run start`  
  Run preview build via electron-vite.

- `npm run lint`  
  ESLint checks.

- `npm run format`  
  Prettier write pass.

- `npm run typecheck`  
  Runs:
  - `typecheck:node`
  - `typecheck:web`

- `npm run build`  
  Typecheck + electron-vite build.

- `npm run build:unpack`  
  Create unpacked distributable directory.

- `npm run build:win` / `build:mac` / `build:linux`  
  Platform packaging via electron-builder.

---

## AI Sidebar Usage

### 1) Save API key

Open **Settings** from explorer footer:

- save Gemini key (`AIza...`) or OpenAI key (`sk-...`)
- test key with live provider ping

### 2) Pick chat mode

Modes:

- `Agent`: implementation-focused
- `Plan`: architecture/planning
- `Debug`: troubleshooting/root cause
- `Ask`: concise Q&A

### 3) Send a message

- Enter to send
- Shift+Enter for newline
- assistant response streams progressively

### Provider routing

The app auto-detects provider by key format:

- `AIza...` -> Gemini model path
- `sk-...` -> OpenAI model path

If key format/provider is invalid, chat receives stream error message.

---

## Packaging and Distribution

Configured in `electron-builder.yml`:

- `appId`: `com.automake.app`
- `productName`: `AutoMake`
- icon source: `resources/icon.png`
- targets:
  - Windows NSIS
  - mac DMG
  - Linux AppImage/Snap/Deb

Build examples:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

---

## Troubleshooting

### `API key not valid` while chatting

- Ensure key matches selected provider format:
  - Gemini: `AIza...`
  - OpenAI: `sk-...`
- Re-open Settings and use **Test Key**.
- Replace key if needed.

### Chat doesn’t stream

- Check that key is saved.
- Check internet access/firewall.
- Watch terminal/devtools for `ai.streamError` payload.

### Terminal errors on app close

- Terminal IPC send safety is guarded for window destruction race conditions.
- If issue reappears, capture stack trace and current action.

### Build issues

- Reinstall dependencies: `npm install`
- Run typecheck: `npm run typecheck`
- Run lint: `npm run lint`

---

## Development Notes

- Keep main/renderer boundaries strict:
  - file system, terminal, key handling, AI runtime in **main**
  - UI + orchestration in **renderer**
- Avoid reading editor/DOM directly for AI context; use Zustand state.
- Keep changes scoped:
  - do not regress explorer/tree/tab/terminal behavior
- Validate after edits:
  - lint + typecheck

---

## License / Credits

Project scaffold and tooling are based on the Electron + Vite ecosystem (`electron-vite`, `electron-builder`, React + TypeScript stack).
