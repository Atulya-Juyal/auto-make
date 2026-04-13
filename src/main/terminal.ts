import * as pty from 'node-pty'
import { BrowserWindow, ipcMain, WebContents } from 'electron'
import * as os from 'os'
import { getWorkspacePath } from './workspacePath'

type WindowTerminalState = {
  sessions: Map<string, pty.IPty>
}

const stateByWebContentsId = new Map<number, WindowTerminalState>()

let idSeq = 0

function newSessionId(): string {
  idSeq += 1
  return `term-${idSeq}`
}

/** Same display name for every session in the list (VS Code–style). */
function shellDisplayName(): string {
  return os.platform() === 'win32' ? 'powershell' : 'bash'
}

function getState(wc: WebContents): WindowTerminalState {
  let s = stateByWebContentsId.get(wc.id)
  if (!s) {
    s = { sessions: new Map() }
    stateByWebContentsId.set(wc.id, s)
  }
  return s
}

function cleanupWebContents(wc: WebContents): void {
  const s = stateByWebContentsId.get(wc.id)
  if (!s) return
  for (const p of s.sessions.values()) {
    try {
      p.kill()
    } catch {
      /* ignore */
    }
  }
  stateByWebContentsId.delete(wc.id)
}

/** After the workspace folder changes: kill all shells and notify renderers to bootstrap again. */
export function resetTerminalSessionsForWorkspaceChange(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    const wc = win.webContents
    if (!stateByWebContentsId.has(wc.id)) continue
    cleanupWebContents(wc)
    if (!wc.isDestroyed()) {
      wc.send('terminal.sessionsReset')
    }
  }
}

function listTerminals(state: WindowTerminalState): { id: string; label: string }[] {
  const label = shellDisplayName()
  return [...state.sessions.keys()].map((id) => ({ id, label }))
}

function safeSend(wc: WebContents, channel: string, payload?: unknown): void {
  if (wc.isDestroyed()) return
  try {
    if (payload === undefined) wc.send(channel)
    else wc.send(channel, payload)
  } catch {
    /* window already closing/destroyed */
  }
}

function spawnPty(wc: WebContents, state: WindowTerminalState): { id: string; label: string } {
  const id = newSessionId()

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'
  /** `-NoLogo` skips the copyright / “install latest PowerShell” banner (clean prompt only). */
  const shellArgs = os.platform() === 'win32' ? ['-NoLogo'] : []

  const ptyProcess = pty.spawn(shell, shellArgs, {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: getWorkspacePath(),
    env: process.env as Record<string, string>
  })

  state.sessions.set(id, ptyProcess)

  ptyProcess.onData((data) => {
    safeSend(wc, 'terminal.incData', { id, data })
  })

  return { id, label: shellDisplayName() }
}

let ipcRegistered = false

/**
 * Per-window PTY sessions with create/dispose; IPC is registered once so HMR / extra
 * windows do not duplicate listeners. Input and resize are scoped by session id.
 */
export function setupTerminal(webContents: WebContents): void {
  if (!ipcRegistered) {
    ipcRegistered = true

    ipcMain.removeHandler('terminal.bootstrap')
    ipcMain.removeHandler('terminal.create')
    ipcMain.removeHandler('terminal.dispose')
    ipcMain.removeAllListeners('terminal.toTerm')
    ipcMain.removeAllListeners('terminal.resize')

    ipcMain.handle('terminal.bootstrap', (event) => {
      const wc = event.sender
      const state = getState(wc)
      if (state.sessions.size === 0) {
        spawnPty(wc, state)
      }
      return { terminals: listTerminals(state) }
    })

    ipcMain.handle('terminal.create', (event) => {
      const wc = event.sender
      const state = getState(wc)
      return spawnPty(wc, state)
    })

    ipcMain.handle('terminal.dispose', (event, id: string) => {
      const wc = event.sender
      const state = stateByWebContentsId.get(wc.id)
      if (!state) return
      const proc = state.sessions.get(id)
      if (!proc) return
      try {
        proc.kill()
      } catch {
        /* ignore */
      }
      state.sessions.delete(id)
    })

    ipcMain.on('terminal.toTerm', (event, id: string, data: string) => {
      const wc = event.sender
      const state = stateByWebContentsId.get(wc.id)
      state?.sessions.get(id)?.write(data)
    })

    ipcMain.on('terminal.resize', (event, id: string, cols: number, rows: number) => {
      const wc = event.sender
      const state = stateByWebContentsId.get(wc.id)
      const proc = state?.sessions.get(id)
      if (proc && cols > 0 && rows > 0) {
        try {
          proc.resize(cols, rows)
        } catch {
          /* ignore */
        }
      }
    })
  }

  webContents.on('destroyed', () => {
    cleanupWebContents(webContents)
  })
}
