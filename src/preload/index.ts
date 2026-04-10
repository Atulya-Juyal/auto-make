import { contextBridge, ipcRenderer } from 'electron'

// Inside src/preload/index.ts
const api = {
  onTerminalData: (data: string) => ipcRenderer.send('terminal.toTerm', data),
  receiveTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal.incData', (_event, data) => callback(data))
  },
  resizeTerminal: (cols: number, rows: number) => ipcRenderer.send('terminal.resize', cols, rows),
  
  // ADD THESE THREE LINES:
  getWorkspace: () => ipcRenderer.invoke('fs.getWorkspace'),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs.readDir', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs.readFile', filePath)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}