import { create } from 'zustand';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface AppState {
  workspacePath: string;
  files: FileNode[];
  activeFilePath: string | null;
  activeFileContent: string;
  
  // Actions
  initWorkspace: () => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  workspacePath: '',
  files: [],
  activeFilePath: null,
  activeFileContent: '// Select a file from the explorer...',

  initWorkspace: async () => {
    const path = await window.api.getWorkspace();
    const fileList = await window.api.readDir(path);
    set({ workspacePath: path, files: fileList });
  },

  openFile: async (filePath: string) => {
    const content = await window.api.readFile(filePath);
    set({ activeFilePath: filePath, activeFileContent: content });
  }
}));