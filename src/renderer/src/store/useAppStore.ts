import { create } from 'zustand'

export interface FileNode {
  name: string
  isDirectory: boolean
  path: string
}

export interface EditorTab {
  id: string
  path: string
  title: string
  /** Filled when the tab is opened; cleared after the Monaco model is created. */
  initialContent?: string
}

function fileTitle(filePath: string): string {
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1] || filePath
}

/** Normalize for comparison (slashes, trailing sep, case on Windows). */
function normPath(p: string): string {
  return p
    .trim()
    .replace(/[/\\]+/g, '\\')
    .replace(/\\+$/g, '')
    .toLowerCase()
}

function samePath(a: string, b: string): boolean {
  return normPath(a) === normPath(b)
}

/** True if `p` is the workspace root or a path inside it. */
function pathUnderWorkspace(ws: string, p: string): boolean {
  const r = normPath(ws)
  const c = normPath(p)
  if (!r || !c) return false
  if (c === r) return true
  return c.startsWith(r + '\\')
}

interface AppState {
  workspacePath: string
  rootEntries: FileNode[]
  expandedPaths: Set<string>
  dirChildren: Record<string, FileNode[]>
  loadingPaths: Set<string>

  tabs: EditorTab[]
  activeTabId: string | null

  /** Last clicked file/folder in the tree; null after clicking empty explorer area. */
  explorerSelectedPath: string | null
  /** True while focus is inside the explorer panel (VS Code–style active vs inactive selection). */
  explorerPaneFocused: boolean
  setExplorerSelectedPath: (path: string | null) => void
  setExplorerPaneFocused: (focused: boolean) => void

  /** Monaco accessor for Save; registered from EditorTabsPane. */
  _editorGetValue: (() => string | null) | null
  registerEditorValueGetter: (fn: (() => string | null) | null) => void

  initWorkspace: () => Promise<void>
  toggleFolder: (folderPath: string) => Promise<void>
  /** Open file in a new tab, or focus existing tab for that path. */
  openFileInTab: (filePath: string) => Promise<void>
  setActiveTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  /** Move tab so it sits before `dropBeforeIndex` (0..length; length = end). */
  reorderTab: (draggedId: string, dropBeforeIndex: number) => void
  /** After Monaco model is created from initialContent. */
  consumeTabBootstrap: (filePath: string) => void

  /** Last known saved file contents (disk / last save); used to detect dirty tabs. */
  savedContentByPath: Record<string, string>
  /** Paths whose editor buffer differs from `savedContentByPath`. */
  dirtyPaths: Set<string>
  /** Called from Monaco when a file model’s text changes. */
  updateEditorDirtyState: (filePath: string, value: string) => void

  resolveNewItemParentDir: () => Promise<string>
  revealPathInTree: (targetDir: string) => Promise<void>
  createNewFile: (name: string) => Promise<void>
  createNewFolder: (name: string) => Promise<void>
  saveActiveTab: () => Promise<void>
  openFileFromDialog: () => Promise<void>
  openFolderFromDialog: () => Promise<void>
  /** Force-refresh a directory listing (fixes new file/folder not showing when parent cache is stale). */
  refreshDirInTree: (dirPath: string) => Promise<void>
  /** Close every editor tab (e.g. when switching workspace folder). */
  closeAllTabs: () => void
}

function removeFromSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set)
  next.delete(value)
  return next
}

export const useAppStore = create<AppState>((set, get) => ({
  workspacePath: '',
  rootEntries: [],
  expandedPaths: new Set(),
  dirChildren: {},
  loadingPaths: new Set(),
  tabs: [],
  activeTabId: null,
  explorerSelectedPath: null,
  explorerPaneFocused: false,
  _editorGetValue: null,
  savedContentByPath: {},
  dirtyPaths: new Set<string>(),

  setExplorerSelectedPath: (path) => set({ explorerSelectedPath: path }),
  setExplorerPaneFocused: (focused) => set({ explorerPaneFocused: focused }),
  registerEditorValueGetter: (fn) => set({ _editorGetValue: fn }),

  updateEditorDirtyState: (filePath, value) => {
    const saved = get().savedContentByPath[filePath]
    if (saved === undefined) return
    const dirty = value !== saved
    set((s) => {
      const next = new Set(s.dirtyPaths)
      if (dirty) next.add(filePath)
      else next.delete(filePath)
      return { dirtyPaths: next }
    })
  },

  initWorkspace: async () => {
    const path = await window.api.normalizePath(await window.api.getWorkspace())
    const fileList = await window.api.readDir(path)
    set({
      workspacePath: path,
      rootEntries: fileList,
      expandedPaths: new Set(),
      dirChildren: {},
      loadingPaths: new Set(),
      explorerSelectedPath: null,
      explorerPaneFocused: false
    })
  },

  toggleFolder: async (folderPath: string) => {
    const { expandedPaths, dirChildren, loadingPaths } = get()

    if (expandedPaths.has(folderPath)) {
      set({ expandedPaths: removeFromSet(expandedPaths, folderPath) })
      return
    }

    const nextExpanded = new Set(expandedPaths).add(folderPath)
    set({ expandedPaths: nextExpanded })

    if (dirChildren[folderPath] !== undefined) {
      return
    }

    const nextLoading = new Set(loadingPaths).add(folderPath)
    set({ loadingPaths: nextLoading })

    try {
      const children = await window.api.readDir(folderPath)
      set((s) => ({
        dirChildren: { ...s.dirChildren, [folderPath]: children },
        loadingPaths: removeFromSet(s.loadingPaths, folderPath)
      }))
    } catch (err) {
      console.error('readDir failed:', err)
      set((s) => ({
        dirChildren: { ...s.dirChildren, [folderPath]: [] },
        loadingPaths: removeFromSet(s.loadingPaths, folderPath)
      }))
    }
  },

  openFileInTab: async (filePath: string) => {
    const { tabs } = get()
    const existing = tabs.find((t) => t.path === filePath)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const content = await window.api.readFile(filePath)
    const id = filePath
    const title = fileTitle(filePath)
    set((s) => ({
      tabs: [...s.tabs, { id, path: filePath, title, initialContent: content }],
      activeTabId: id,
      savedContentByPath: { ...s.savedContentByPath, [filePath]: content },
      dirtyPaths: removeFromSet(s.dirtyPaths, filePath)
    }))
  },

  setActiveTab: (tabId: string) => {
    if (!get().tabs.some((t) => t.id === tabId)) return
    set({ activeTabId: tabId })
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return
    const next = tabs.filter((t) => t.id !== tabId)
    let nextActive = activeTabId
    if (activeTabId === tabId) {
      if (next.length === 0) {
        nextActive = null
      } else if (idx >= next.length) {
        nextActive = next[next.length - 1].id
      } else {
        nextActive = next[idx].id
      }
    }
    const closed = tabs[idx]
    set((s) => {
      const { [closed.path]: _removed, ...restSaved } = s.savedContentByPath
      return {
        tabs: next,
        activeTabId: nextActive,
        dirtyPaths: removeFromSet(s.dirtyPaths, closed.path),
        savedContentByPath: restSaved
      }
    })
  },

  reorderTab: (draggedId: string, dropBeforeIndex: number) => {
    const { tabs } = get()
    const fromIndex = tabs.findIndex((t) => t.id === draggedId)
    if (fromIndex === -1) return
    const n = tabs.length
    const drop = Math.max(0, Math.min(dropBeforeIndex, n))
    let insertIndex = drop
    if (fromIndex < drop) {
      insertIndex = drop - 1
    }
    if (insertIndex === fromIndex) {
      return
    }
    const next = [...tabs]
    const [item] = next.splice(fromIndex, 1)
    next.splice(insertIndex, 0, item)
    set({ tabs: next })
  },

  consumeTabBootstrap: (filePath: string) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === filePath ? { ...t, initialContent: undefined } : t))
    }))
  },

  resolveNewItemParentDir: async () => {
    const ws = await window.api.normalizePath(await window.api.getWorkspace())
    if (!ws) {
      window.alert('Workspace is not ready yet. Wait for the folder tree to load.')
      return ''
    }
    const { explorerSelectedPath } = get()
    if (!explorerSelectedPath) return ws

    const sel = await window.api.normalizePath(explorerSelectedPath)
    if (!pathUnderWorkspace(ws, sel)) return ws

    const stat = await window.api.statEntry(sel)
    if (stat.exists && stat.isDirectory) return sel
    if (stat.exists && !stat.isDirectory) {
      return await window.api.normalizePath(await window.api.pathDirname(sel))
    }

    let cur = sel
    for (let i = 0; i < 256; i++) {
      const parent = await window.api.pathDirname(cur)
      const parentNorm = await window.api.normalizePath(parent)
      if (parentNorm === cur) break
      if (!pathUnderWorkspace(ws, parentNorm)) break
      const st = await window.api.statEntry(parentNorm)
      if (st.exists && st.isDirectory) return parentNorm
      cur = parentNorm
    }
    return ws
  },

  refreshDirInTree: async (dirPath: string) => {
    if (!dirPath) return
    const mainWs = await window.api.normalizePath(await window.api.getWorkspace())
    if (!mainWs) return
    const dirNorm = await window.api.normalizePath(dirPath)
    try {
      const list = await window.api.readDir(dirNorm)
      if (samePath(dirNorm, mainWs)) {
        set({ rootEntries: list, workspacePath: mainWs })
      } else {
        set((s) => ({ dirChildren: { ...s.dirChildren, [dirNorm]: list } }))
      }
    } catch {
      /* ignore */
    }
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null, dirtyPaths: new Set(), savedContentByPath: {} })
  },

  revealPathInTree: async (targetDir: string) => {
    if (!targetDir) return

    const wsNorm = await window.api.normalizePath(await window.api.getWorkspace())
    if (!wsNorm) return
    let cur = await window.api.normalizePath(targetDir)
    if (!pathUnderWorkspace(wsNorm, cur)) return

    const up: string[] = []
    for (let i = 0; i < 256; i++) {
      up.push(cur)
      if (samePath(cur, wsNorm)) break
      const parent = await window.api.pathDirname(cur)
      const next = await window.api.normalizePath(parent)
      if (next === cur) return
      if (!pathUnderWorkspace(wsNorm, next)) return
      cur = next
    }
    if (up.length === 0 || !samePath(up[up.length - 1], wsNorm)) return

    const chain = up.slice().reverse()

    const expanded = new Set(get().expandedPaths)
    for (const d of chain) {
      expanded.add(d)
    }
    set({ expandedPaths: expanded })

    for (const d of chain) {
      if (get().dirChildren[d] === undefined) {
        try {
          const children = await window.api.readDir(d)
          set((s) => ({ dirChildren: { ...s.dirChildren, [d]: children } }))
        } catch {
          set((s) => ({ dirChildren: { ...s.dirChildren, [d]: [] } }))
        }
      }
    }

    const leaf = chain[chain.length - 1]
    const list = await window.api.readDir(leaf)
    if (samePath(leaf, wsNorm)) {
      set({ rootEntries: list, workspacePath: wsNorm })
    } else {
      set((s) => ({ dirChildren: { ...s.dirChildren, [leaf]: list } }))
    }
  },

  createNewFile: async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || /[/\\?*"<>|]/.test(trimmed)) {
      window.alert('Invalid file name.')
      return
    }
    const parent = await get().resolveNewItemParentDir()
    if (!parent) return
    const full = await window.api.normalizePath(await window.api.pathJoin(parent, trimmed))
    try {
      await window.api.createEmptyFile(full)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`Could not create the file: ${msg}`)
      return
    }
    await get().revealPathInTree(parent)
    await get().refreshDirInTree(parent)
    await get().openFileInTab(full)
  },

  createNewFolder: async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || /[/\\?*"<>|]/.test(trimmed)) {
      window.alert('Invalid folder name.')
      return
    }
    const parentDir = await get().resolveNewItemParentDir()
    if (!parentDir) return
    const full = await window.api.normalizePath(await window.api.pathJoin(parentDir, trimmed))
    try {
      await window.api.mkdir(full)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`Could not create the folder: ${msg}`)
      return
    }
    await get().revealPathInTree(parentDir)
    await get().refreshDirInTree(parentDir)
    const expanded = new Set(get().expandedPaths)
    expanded.add(parentDir)
    set({ expandedPaths: expanded, explorerSelectedPath: full })
  },

  saveActiveTab: async () => {
    const { activeTabId, tabs, _editorGetValue } = get()
    if (!activeTabId) {
      window.alert('No file is open.')
      return
    }
    const tab = tabs.find((t) => t.id === activeTabId)
    if (!tab) return
    if (!_editorGetValue) {
      window.alert('Editor is not ready.')
      return
    }
    const text = _editorGetValue()
    if (text === null) {
      window.alert('Nothing to save.')
      return
    }
    await window.api.writeFile(tab.path, text)
    set((s) => ({
      savedContentByPath: { ...s.savedContentByPath, [tab.path]: text },
      dirtyPaths: removeFromSet(s.dirtyPaths, tab.path)
    }))
  },

  openFileFromDialog: async () => {
    const picked = await window.api.openFileDialog()
    if (!picked) return
    const dir = await window.api.pathDirname(picked)
    await window.api.setWorkspace(dir)
    await get().initWorkspace()
    await get().openFileInTab(picked)
  },

  openFolderFromDialog: async () => {
    const picked = await window.api.openFolderDialog()
    if (!picked) return
    get().closeAllTabs()
    await window.api.setWorkspace(picked)
    await get().initWorkspace()
  }
}))
