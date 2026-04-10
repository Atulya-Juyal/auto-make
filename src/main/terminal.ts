import * as pty from 'node-pty';
import { ipcMain, WebContents } from 'electron';
import * as os from 'os';

export function setupTerminal(webContents: WebContents) {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.USERPROFILE || process.env.HOME,
    env: process.env as Record<string, string>
  });

  ptyProcess.onData((data) => {
    webContents.send('terminal.incData', data);
  });

  ipcMain.on('terminal.toTerm', (_event, data) => {
    ptyProcess.write(data);
  });

  // Add this listener:
  ipcMain.on('terminal.resize', (_event, cols, rows) => {
    ptyProcess.resize(cols, rows);
  });
}