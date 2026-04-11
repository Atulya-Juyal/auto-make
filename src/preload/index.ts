import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

/** Window event so only one ipcRenderer listener is needed (avoids HMR / duplicate subs). */
const TERMINAL_OUTPUT_EVENT = 'auto-mern:terminal-output';

const forwardTerminalData = (_event: IpcRendererEvent, data: string): void => {
  window.dispatchEvent(new CustomEvent(TERMINAL_OUTPUT_EVENT, { detail: data }));
};

ipcRenderer.removeAllListeners('terminal.incData');
ipcRenderer.on('terminal.incData', forwardTerminalData);

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

  getWorkspace: () => ipcRenderer.invoke('fs.getWorkspace'),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs.readDir', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs.readFile', filePath),
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
