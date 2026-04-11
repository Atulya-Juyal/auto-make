import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

/** Window event so only one ipcRenderer listener is needed (avoids HMR / duplicate subs). */
const TERMINAL_OUTPUT_EVENT = 'auto-mern:terminal-output';
const WIN_MAX_EVENT = 'auto-mern:win-maximize';

const forwardTerminalData = (_event: IpcRendererEvent, data: string): void => {
  window.dispatchEvent(new CustomEvent(TERMINAL_OUTPUT_EVENT, { detail: data }));
};

const forwardWinMax = (_event: IpcRendererEvent, max: boolean): void => {
  window.dispatchEvent(new CustomEvent(WIN_MAX_EVENT, { detail: max }));
};

ipcRenderer.removeAllListeners('terminal.incData');
ipcRenderer.on('terminal.incData', forwardTerminalData);

ipcRenderer.removeAllListeners('win-maximize-changed');
ipcRenderer.on('win-maximize-changed', forwardWinMax);

const api = {
  onTerminalData: (data: string) => ipcRenderer.send('terminal.toTerm', data),
  receiveTerminalData: (callback: (data: string) => void): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<string>).detail);
    };
    window.addEventListener(TERMINAL_OUTPUT_EVENT, listener);
    return () => window.removeEventListener(TERMINAL_OUTPUT_EVENT, listener);
  },
  resizeTerminal: (cols: number, rows: number) => ipcRenderer.send('terminal.resize', cols, rows),

  getWorkspace: () => ipcRenderer.invoke('fs.getWorkspace') as Promise<string>,
  setWorkspace: (dir: string) => ipcRenderer.invoke('fs.setWorkspace', dir) as Promise<string>,
  readDir: (dirPath: string) => ipcRenderer.invoke('fs.readDir', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs.readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs.writeFile', filePath, content) as Promise<void>,
  mkdir: (dirPath: string) => ipcRenderer.invoke('fs.mkdir', dirPath) as Promise<void>,
  pathDirname: (p: string) => ipcRenderer.invoke('fs.pathDirname', p) as Promise<string>,
  pathJoin: (...parts: string[]) =>
    ipcRenderer.invoke('fs.pathJoinParts', parts) as Promise<string>,
  statEntry: (p: string) =>
    ipcRenderer.invoke('fs.statEntry', p) as Promise<{ exists: boolean; isDirectory: boolean }>,
  createEmptyFile: (filePath: string) =>
    ipcRenderer.invoke('fs.createEmptyFile', filePath) as Promise<void>,
  normalizePath: (p: string) => ipcRenderer.invoke('fs.normalizePath', p) as Promise<string>,

  openFileDialog: () => ipcRenderer.invoke('dialog.openFile') as Promise<string | null>,
  openFolderDialog: () => ipcRenderer.invoke('dialog.openFolder') as Promise<string | null>,

  winMinimize: () => ipcRenderer.invoke('win.minimize') as Promise<void>,
  winMaximizeToggle: () => ipcRenderer.invoke('win.maximizeToggle') as Promise<void>,
  winClose: () => ipcRenderer.invoke('win.close') as Promise<void>,
  winIsMaximized: () => ipcRenderer.invoke('win.isMaximized') as Promise<boolean>,
  onWinMaximizeChanged: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<boolean>).detail);
    };
    window.addEventListener(WIN_MAX_EVENT, listener);
    return () => window.removeEventListener(WIN_MAX_EVENT, listener);
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api;
}
