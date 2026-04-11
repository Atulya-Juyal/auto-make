// Inside src/preload/index.d.ts
import { ElectronAPI } from '@electron-toolkit/preload'

export interface FileNodeDTO {
  name: string
  isDirectory: boolean
  path: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      terminalBootstrap: () => Promise<{ terminals: { id: string; label: string }[] }>
      terminalCreate: () => Promise<{ id: string; label: string }>
      terminalDispose: (id: string) => Promise<void>
      onTerminalData: (id: string, data: string) => void
      receiveTerminalData: (callback: (payload: { id: string; data: string }) => void) => () => void
      onTerminalSessionsReset: (callback: () => void) => () => void
      resizeTerminal: (id: string, cols: number, rows: number) => void
      getWorkspace: () => Promise<string>
      setWorkspace: (dir: string) => Promise<string>
      readDir: (dirPath: string) => Promise<FileNodeDTO[]>
      readFile: (filePath: string) => Promise<string>
      writeFile: (filePath: string, content: string) => Promise<void>
      mkdir: (dirPath: string) => Promise<void>
      pathDirname: (p: string) => Promise<string>
      pathJoin: (...parts: string[]) => Promise<string>
      statEntry: (p: string) => Promise<{ exists: boolean; isDirectory: boolean }>
      createEmptyFile: (filePath: string) => Promise<void>
      normalizePath: (p: string) => Promise<string>
      openFileDialog: () => Promise<string | null>
      openFolderDialog: () => Promise<string | null>
      winMinimize: () => Promise<void>
      winMaximizeToggle: () => Promise<void>
      winClose: () => Promise<void>
      winIsMaximized: () => Promise<boolean>
      onWinMaximizeChanged: (callback: (maximized: boolean) => void) => () => void
    }
  }
}
