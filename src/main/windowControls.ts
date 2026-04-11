import { BrowserWindow, ipcMain } from 'electron';

export function setupWindowControls(win: BrowserWindow): void {
  const sendMax = (): void => {
    win.webContents.send('win-maximize-changed', win.isMaximized());
  };

  win.on('maximize', sendMax);
  win.on('unmaximize', sendMax);

  ipcMain.removeHandler('win.minimize');
  ipcMain.removeHandler('win.maximizeToggle');
  ipcMain.removeHandler('win.close');
  ipcMain.removeHandler('win.isMaximized');

  ipcMain.handle('win.minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle('win.maximizeToggle', (event) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (!w) return;
    if (w.isMaximized()) {
      w.unmaximize();
    } else {
      w.maximize();
    }
  });

  ipcMain.handle('win.close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle('win.isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
  });
}
