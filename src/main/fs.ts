import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getWorkspacePath, setWorkspacePath } from './workspacePath'
import { resetTerminalSessionsForWorkspaceChange } from './terminal'

function registerFShandlers(): void {
  ipcMain.removeHandler('fs.getWorkspace')
  ipcMain.removeHandler('fs.setWorkspace')
  ipcMain.removeHandler('fs.readDir')
  ipcMain.removeHandler('fs.readFile')
  ipcMain.removeHandler('fs.writeFile')
  ipcMain.removeHandler('fs.mkdir')
  ipcMain.removeHandler('fs.pathDirname')
  ipcMain.removeHandler('fs.pathJoin')
  ipcMain.removeHandler('fs.pathJoinParts')
  ipcMain.removeHandler('fs.statEntry')
  ipcMain.removeHandler('fs.createEmptyFile')
  ipcMain.removeHandler('fs.normalizePath')

  ipcMain.handle('fs.getWorkspace', () => getWorkspacePath())

  ipcMain.handle('fs.normalizePath', (_event, p: string) => path.normalize(p))

  ipcMain.handle('fs.setWorkspace', async (_event, newRoot: string) => {
    const resolved = path.resolve(newRoot)
    try {
      const st = await fs.stat(resolved)
      if (!st.isDirectory()) {
        throw new Error('Path is not a directory')
      }
    } catch {
      throw new Error('Invalid workspace directory')
    }
    setWorkspacePath(resolved)
    resetTerminalSessionsForWorkspaceChange()
    return getWorkspacePath()
  })

  ipcMain.handle('fs.readDir', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => e.name !== 'node_modules' && e.name !== '.git')
        .map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: path.join(dirPath, e.name)
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name)
        })
    } catch (error) {
      console.error('Error reading directory:', error)
      return []
    }
  })

  ipcMain.handle('fs.readFile', async (_event, filePath: string) => {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      console.error('Error reading file:', error)
      return '// Error reading file'
    }
  })

  ipcMain.handle('fs.writeFile', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('fs.mkdir', async (_event, dirPath: string) => {
    await fs.mkdir(dirPath, { recursive: false })
  })

  ipcMain.handle('fs.pathDirname', (_event, p: string) => path.dirname(p))

  ipcMain.handle('fs.pathJoin', (_event, ...parts: string[]) => path.join(...parts))

  /** Prefer this from renderer: variadic `pathJoin` over IPC can drop args in some builds. */
  ipcMain.handle('fs.pathJoinParts', (_event, parts: string[]) => path.join(...parts))

  ipcMain.handle('fs.statEntry', async (_event, p: string) => {
    try {
      const st = await fs.stat(p)
      return { exists: true, isDirectory: st.isDirectory() }
    } catch {
      return { exists: false, isDirectory: false }
    }
  })

  ipcMain.handle('fs.createEmptyFile', async (_event, filePath: string) => {
    try {
      await fs.writeFile(filePath, '', { flag: 'wx' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(msg)
    }
  })
}

export function setupFSHandlers(): void {
  registerFShandlers()
}
