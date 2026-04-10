// Inside src/preload/index.d.ts
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onTerminalData: (data: string) => void
      receiveTerminalData: (callback: (data: string) => void) => void
      resizeTerminal: (cols: number, rows: number) => void
      // ADD THESE THREE LINES:
      getWorkspace: () => Promise<string>
      readDir: (dirPath: string) => Promise<Array<{name: string, isDirectory: boolean, path: string}>>
      readFile: (filePath: string) => Promise<string>
    }
  }
}