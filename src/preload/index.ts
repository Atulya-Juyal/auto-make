import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

/** Window event so only one ipcRenderer listener is needed (avoids HMR / duplicate subs). */
const TERMINAL_OUTPUT_EVENT = 'auto-mern:terminal-output'
const TERMINAL_SESSIONS_RESET_EVENT = 'auto-mern:terminal-sessions-reset'
const WIN_MAX_EVENT = 'auto-mern:win-maximize'
const AI_STREAM_CHUNK_EVENT = 'auto-mern:ai-stream-chunk'
const AI_STREAM_END_EVENT = 'auto-mern:ai-stream-end'
const AI_STREAM_ERROR_EVENT = 'auto-mern:ai-stream-error'

const forwardTerminalData = (
  _event: IpcRendererEvent,
  payload: { id: string; data: string }
): void => {
  window.dispatchEvent(new CustomEvent(TERMINAL_OUTPUT_EVENT, { detail: payload }))
}

const forwardWinMax = (_event: IpcRendererEvent, max: boolean): void => {
  window.dispatchEvent(new CustomEvent(WIN_MAX_EVENT, { detail: max }))
}

const forwardSessionsReset = (): void => {
  window.dispatchEvent(new CustomEvent(TERMINAL_SESSIONS_RESET_EVENT))
}

const forwardAiStreamChunk = (
  _event: IpcRendererEvent,
  payload: { requestId: string; messageId: string; chunk: string }
): void => {
  window.dispatchEvent(new CustomEvent(AI_STREAM_CHUNK_EVENT, { detail: payload }))
}

const forwardAiStreamEnd = (
  _event: IpcRendererEvent,
  payload: { requestId: string; messageId: string }
): void => {
  window.dispatchEvent(new CustomEvent(AI_STREAM_END_EVENT, { detail: payload }))
}

const forwardAiStreamError = (
  _event: IpcRendererEvent,
  payload: { requestId: string; messageId: string; error: string }
): void => {
  window.dispatchEvent(new CustomEvent(AI_STREAM_ERROR_EVENT, { detail: payload }))
}

ipcRenderer.removeAllListeners('terminal.incData')
ipcRenderer.on('terminal.incData', forwardTerminalData)

ipcRenderer.removeAllListeners('terminal.sessionsReset')
ipcRenderer.on('terminal.sessionsReset', forwardSessionsReset)

ipcRenderer.removeAllListeners('win-maximize-changed')
ipcRenderer.on('win-maximize-changed', forwardWinMax)

ipcRenderer.removeAllListeners('ai.streamChunk')
ipcRenderer.on('ai.streamChunk', forwardAiStreamChunk)

ipcRenderer.removeAllListeners('ai.streamEnd')
ipcRenderer.on('ai.streamEnd', forwardAiStreamEnd)

ipcRenderer.removeAllListeners('ai.streamError')
ipcRenderer.on('ai.streamError', forwardAiStreamError)

const api = {
  terminalBootstrap: () =>
    ipcRenderer.invoke('terminal.bootstrap') as Promise<{
      terminals: { id: string; label: string }[]
    }>,
  terminalCreate: () =>
    ipcRenderer.invoke('terminal.create') as Promise<{ id: string; label: string }>,
  terminalDispose: (id: string) => ipcRenderer.invoke('terminal.dispose', id) as Promise<void>,
  onTerminalData: (id: string, data: string) => ipcRenderer.send('terminal.toTerm', id, data),
  receiveTerminalData: (
    callback: (payload: { id: string; data: string }) => void
  ): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<{ id: string; data: string }>).detail)
    }
    window.addEventListener(TERMINAL_OUTPUT_EVENT, listener)
    return () => window.removeEventListener(TERMINAL_OUTPUT_EVENT, listener)
  },
  onTerminalSessionsReset: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    window.addEventListener(TERMINAL_SESSIONS_RESET_EVENT, listener)
    return () => window.removeEventListener(TERMINAL_SESSIONS_RESET_EVENT, listener)
  },
  resizeTerminal: (id: string, cols: number, rows: number) =>
    ipcRenderer.send('terminal.resize', id, cols, rows),

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
  getApiKeySecure: () => ipcRenderer.invoke('secrets.getApiKey') as Promise<string>,
  setApiKeySecure: (key: string) => ipcRenderer.invoke('secrets.setApiKey', key) as Promise<void>,
  hasApiKeySecure: () => ipcRenderer.invoke('secrets.hasApiKey') as Promise<boolean>,
  isSecureStorageAvailable: () =>
    ipcRenderer.invoke('secrets.isSecureStorageAvailable') as Promise<boolean>,
  startAiStream: (payload: {
    requestId: string
    messageId: string
    prompt: string
    aiMode: 'Agent' | 'Plan' | 'Debug' | 'Ask'
    activeFileContent: string
  }) => ipcRenderer.invoke('ai.startStream', payload) as Promise<{ accepted: boolean }>,
  cancelAiStream: (requestId: string) => ipcRenderer.invoke('ai.cancelStream', requestId) as Promise<void>,
  onAiStreamChunk: (
    callback: (payload: { requestId: string; messageId: string; chunk: string }) => void
  ): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<{ requestId: string; messageId: string; chunk: string }>).detail)
    }
    window.addEventListener(AI_STREAM_CHUNK_EVENT, listener)
    return () => window.removeEventListener(AI_STREAM_CHUNK_EVENT, listener)
  },
  onAiStreamEnd: (callback: (payload: { requestId: string; messageId: string }) => void): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<{ requestId: string; messageId: string }>).detail)
    }
    window.addEventListener(AI_STREAM_END_EVENT, listener)
    return () => window.removeEventListener(AI_STREAM_END_EVENT, listener)
  },
  onAiStreamError: (
    callback: (payload: { requestId: string; messageId: string; error: string }) => void
  ): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<{ requestId: string; messageId: string; error: string }>).detail)
    }
    window.addEventListener(AI_STREAM_ERROR_EVENT, listener)
    return () => window.removeEventListener(AI_STREAM_ERROR_EVENT, listener)
  },

  winMinimize: () => ipcRenderer.invoke('win.minimize') as Promise<void>,
  winMaximizeToggle: () => ipcRenderer.invoke('win.maximizeToggle') as Promise<void>,
  winClose: () => ipcRenderer.invoke('win.close') as Promise<void>,
  winIsMaximized: () => ipcRenderer.invoke('win.isMaximized') as Promise<boolean>,
  onWinMaximizeChanged: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (ev: Event): void => {
      callback((ev as CustomEvent<boolean>).detail)
    }
    window.addEventListener(WIN_MAX_EVENT, listener)
    return () => window.removeEventListener(WIN_MAX_EVENT, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api
}
