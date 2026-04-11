import * as pty from 'node-pty';
import { ipcMain, WebContents } from 'electron';
import * as os from 'os';

let activeSession: { pty: pty.IPty; webContents: WebContents } | null = null;

/**
 * One PTY + one pair of IPC handlers per app instance. Prevents stacked
 * ipcMain listeners (dev reload / extra windows) from duplicating I/O to xterm.
 */
export function setupTerminal(webContents: WebContents): void {
  ipcMain.removeAllListeners('terminal.toTerm');
  ipcMain.removeAllListeners('terminal.resize');

  if (activeSession) {
    try {
      activeSession.pty.kill();
    } catch {
      /* ignore */
    }
    activeSession = null;
  }

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.USERPROFILE || process.env.HOME,
    env: process.env as Record<string, string>,
  });

  activeSession = { pty: ptyProcess, webContents };

  ptyProcess.onData((data) => {
    webContents.send('terminal.incData', data);
  });

  ipcMain.on('terminal.toTerm', (_event, data: string) => {
    ptyProcess.write(data);
  });

  ipcMain.on('terminal.resize', (_event, cols: number, rows: number) => {
    ptyProcess.resize(cols, rows);
  });
}
