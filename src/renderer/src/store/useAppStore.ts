import { create } from 'zustand';

export interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface EditorTab {
  id: string;
  path: string;
  title: string;
  /** Filled when the tab is opened; cleared after the Monaco model is created. */
  initialContent?: string;
}

function fileTitle(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

interface AppState {
  workspacePath: string;
  rootEntries: FileNode[];
  expandedPaths: Set<string>;
  dirChildren: Record<string, FileNode[]>;
  loadingPaths: Set<string>;

  tabs: EditorTab[];
  activeTabId: string | null;

  initWorkspace: () => Promise<void>;
  toggleFolder: (folderPath: string) => Promise<void>;
  /** Open file in a new tab, or focus existing tab for that path. */
  openFileInTab: (filePath: string) => Promise<void>;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  /** Move tab so it sits before `dropBeforeIndex` (0..length; length = end). */
  reorderTab: (draggedId: string, dropBeforeIndex: number) => void;
  /** After Monaco model is created from initialContent. */
  consumeTabBootstrap: (filePath: string) => void;
}

function removeFromSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  next.delete(value);
  return next;
}

export const useAppStore = create<AppState>((set, get) => ({
  workspacePath: '',
  rootEntries: [],
  expandedPaths: new Set(),
  dirChildren: {},
  loadingPaths: new Set(),
  tabs: [],
  activeTabId: null,

  initWorkspace: async () => {
    const path = await window.api.getWorkspace();
    const fileList = await window.api.readDir(path);
    set({
      workspacePath: path,
      rootEntries: fileList,
      expandedPaths: new Set(),
      dirChildren: {},
      loadingPaths: new Set(),
    });
  },

  toggleFolder: async (folderPath: string) => {
    const { expandedPaths, dirChildren, loadingPaths } = get();

    if (expandedPaths.has(folderPath)) {
      set({ expandedPaths: removeFromSet(expandedPaths, folderPath) });
      return;
    }

    const nextExpanded = new Set(expandedPaths).add(folderPath);
    set({ expandedPaths: nextExpanded });

    if (dirChildren[folderPath] !== undefined) {
      return;
    }

    const nextLoading = new Set(loadingPaths).add(folderPath);
    set({ loadingPaths: nextLoading });

    try {
      const children = await window.api.readDir(folderPath);
      set((s) => ({
        dirChildren: { ...s.dirChildren, [folderPath]: children },
        loadingPaths: removeFromSet(s.loadingPaths, folderPath),
      }));
    } catch (err) {
      console.error('readDir failed:', err);
      set((s) => ({
        dirChildren: { ...s.dirChildren, [folderPath]: [] },
        loadingPaths: removeFromSet(s.loadingPaths, folderPath),
      }));
    }
  },

  openFileInTab: async (filePath: string) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === filePath);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const content = await window.api.readFile(filePath);
    const id = filePath;
    const title = fileTitle(filePath);
    set((s) => ({
      tabs: [...s.tabs, { id, path: filePath, title, initialContent: content }],
      activeTabId: id,
    }));
  },

  setActiveTab: (tabId: string) => {
    if (!get().tabs.some((t) => t.id === tabId)) return;
    set({ activeTabId: tabId });
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    const next = tabs.filter((t) => t.id !== tabId);
    let nextActive = activeTabId;
    if (activeTabId === tabId) {
      if (next.length === 0) {
        nextActive = null;
      } else if (idx >= next.length) {
        nextActive = next[next.length - 1].id;
      } else {
        nextActive = next[idx].id;
      }
    }
    set({ tabs: next, activeTabId: nextActive });
  },

  reorderTab: (draggedId: string, dropBeforeIndex: number) => {
    const { tabs } = get();
    const fromIndex = tabs.findIndex((t) => t.id === draggedId);
    if (fromIndex === -1) return;
    const n = tabs.length;
    const drop = Math.max(0, Math.min(dropBeforeIndex, n));
    let insertIndex = drop;
    if (fromIndex < drop) {
      insertIndex = drop - 1;
    }
    if (insertIndex === fromIndex) {
      return;
    }
    const next = [...tabs];
    const [item] = next.splice(fromIndex, 1);
    next.splice(insertIndex, 0, item);
    set({ tabs: next });
  },

  consumeTabBootstrap: (filePath: string) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.path === filePath ? { ...t, initialContent: undefined } : t,
      ),
    }));
  },
}));
