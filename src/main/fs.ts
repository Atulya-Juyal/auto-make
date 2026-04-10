import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

export function setupFSHandlers() {
  // 1. Get the current working directory
  ipcMain.handle('fs.getWorkspace', () => {
    return process.cwd(); 
  });

  // 2. Read a folder and return its files (ignoring node_modules and .git)
  ipcMain.handle('fs.readDir', async (_event, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(e => e.name !== 'node_modules' && e.name !== '.git')
        .map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: path.join(dirPath, e.name)
        }))
        // Sort folders to the top
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      console.error("Error reading directory:", error);
      return [];
    }
  });

  // 3. Read the actual text inside a file
  ipcMain.handle('fs.readFile', async (_event, filePath) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error("Error reading file:", error);
      return "// Error reading file";
    }
  });
}