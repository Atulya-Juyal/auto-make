import { BrowserWindow, dialog, ipcMain } from 'electron';

export function setupDialogHandlers(): void {
  ipcMain.removeHandler('dialog.openFile');
  ipcMain.removeHandler('dialog.openFolder');

  ipcMain.handle('dialog.openFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle('dialog.openFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });
}
