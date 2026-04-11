import { create } from 'zustand';

export interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface AppState {
  workspacePath: string;
  /** Top-level entries in the workspace root (from initial readDir). */
  rootEntries: FileNode[];
  /** Which folder paths are expanded in the tree. */
  expandedPaths: Set<string>;
  /** Cached directory listings: folder path → children (loaded lazily). */
  dirChildren: Record<string, FileNode[]>;
  /** Folders currently loading via readDir. */
  loadingPaths: Set<string>;

  activeFilePath: string | null;
  activeFileContent: string;

  initWorkspace: () => Promise<void>;
  toggleFolder: (folderPath: string) => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
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
  activeFilePath: null,
  activeFileContent: '// Select a file from the explorer...',

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

  openFile: async (filePath: string) => {
    const content = await window.api.readFile(filePath);
    set({ activeFilePath: filePath, activeFileContent: content });
  },
}));
