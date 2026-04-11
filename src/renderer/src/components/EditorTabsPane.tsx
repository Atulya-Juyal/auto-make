import Editor, { type OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { useEffect, useRef, useState, type DragEvent, type ReactElement } from 'react'
import { useAppStore } from '../store/useAppStore'

const EMPTY_URI_PATH = 'inmemory://empty/placeholder'
const DND_TAB_MIME = 'text/x-auto-mern-tab-id'

function languageIdForPath(filePath: string): string {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.tsx')) return 'typescript'
  if (lower.endsWith('.ts')) return 'typescript'
  if (lower.endsWith('.jsx') || lower.endsWith('.js')) return 'javascript'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.html')) return 'html'
  if (lower.endsWith('.md')) return 'markdown'
  return 'plaintext'
}

export function EditorTabsPane(): ReactElement {
  const tabs = useAppStore((s) => s.tabs)
  const dirtyPaths = useAppStore((s) => s.dirtyPaths)
  const activeTabId = useAppStore((s) => s.activeTabId)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const closeTab = useAppStore((s) => s.closeTab)
  const reorderTab = useAppStore((s) => s.reorderTab)
  const consumeTabBootstrap = useAppStore((s) => s.consumeTabBootstrap)

  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dropBeforeIndex, setDropBeforeIndex] = useState<number | null>(null)

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const emptyModelRef = useRef<Monaco.editor.ITextModel | null>(null)

  const disposeRemovedModels = (prevTabs: typeof tabs, nextTabs: typeof tabs) => {
    const monaco = monacoRef.current
    if (!monaco) return
    const nextPaths = new Set(nextTabs.map((t) => t.path))
    for (const t of prevTabs) {
      if (!nextPaths.has(t.path)) {
        const uri = monaco.Uri.file(t.path)
        const model = monaco.editor.getModel(uri)
        model?.dispose()
      }
    }
  }

  const prevTabsForDispose = useRef<typeof tabs>([])
  useEffect(() => {
    disposeRemovedModels(prevTabsForDispose.current, tabs)
    prevTabsForDispose.current = tabs
  }, [tabs])

  const registerEditorValueGetter = useAppStore((s) => s.registerEditorValueGetter)
  const dirtyTrackedModels = useRef(new WeakSet<Monaco.editor.ITextModel>())

  useEffect(() => {
    const getter = (): string | null => {
      const ed = editorRef.current
      const m = ed?.getModel()
      if (!m) return null
      return m.getValue()
    }
    registerEditorValueGetter(getter)
    return () => registerEditorValueGetter(null)
  }, [registerEditorValueGetter])

  const applyActiveModel = () => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    const { tabs: tabList, activeTabId: activeId } = useAppStore.getState()
    const tab = activeId ? tabList.find((t) => t.id === activeId) : null

    if (!tab) {
      if (!emptyModelRef.current) {
        const uri = monaco.Uri.parse(EMPTY_URI_PATH)
        emptyModelRef.current = monaco.editor.createModel(
          '// Open a file from the explorer…',
          'plaintext',
          uri
        )
      }
      editor.setModel(emptyModelRef.current)
      return
    }

    const uri = monaco.Uri.file(tab.path)
    let model = monaco.editor.getModel(uri)
    if (!model) {
      const content = tab.initialContent ?? ''
      model = monaco.editor.createModel(content, languageIdForPath(tab.path), uri)
      if (tab.initialContent !== undefined) {
        consumeTabBootstrap(tab.path)
      }
    }

    const store = useAppStore.getState()
    if (store.savedContentByPath[tab.path] === undefined) {
      useAppStore.setState((s) => ({
        savedContentByPath: { ...s.savedContentByPath, [tab.path]: model.getValue() }
      }))
    }

    if (!dirtyTrackedModels.current.has(model)) {
      dirtyTrackedModels.current.add(model)
      model.onDidChangeContent(() => {
        useAppStore.getState().updateEditorDirtyState(tab.path, model.getValue())
      })
    }
    useAppStore.getState().updateEditorDirtyState(tab.path, model.getValue())

    editor.setModel(model)
  }

  useEffect(() => {
    applyActiveModel()
  }, [activeTabId, tabs, consumeTabBootstrap])

  const clearDropUi = () => {
    setDropBeforeIndex(null)
    setDraggedTabId(null)
  }

  const onTabDragStart = (e: DragEvent, tabId: string) => {
    const t = e.target as HTMLElement
    if (t.closest('.editor-tab-dismiss')) {
      e.preventDefault()
      return
    }
    setDraggedTabId(tabId)
    e.dataTransfer.setData(DND_TAB_MIME, tabId)
    e.dataTransfer.setData('text/plain', tabId)
    e.dataTransfer.effectAllowed = 'move'

    const tabEl = e.currentTarget as HTMLElement
    const label = tabEl.querySelector<HTMLElement>('.editor-tab-label')
    if (!label) {
      return
    }

    const rect = label.getBoundingClientRect()
    const labelStyle = window.getComputedStyle(label)
    const tabStyle = window.getComputedStyle(tabEl)

    const ghost = label.cloneNode(true) as HTMLElement
    ghost.style.cssText = [
      'position:fixed',
      'left:-10000px',
      'top:0',
      `width:${Math.ceil(rect.width)}px`,
      `min-height:${Math.ceil(rect.height)}px`,
      'box-sizing:border-box',
      'margin:0',
      `padding:${labelStyle.paddingTop} ${labelStyle.paddingRight} ${labelStyle.paddingBottom} ${labelStyle.paddingLeft}`,
      `font-size:${labelStyle.fontSize}`,
      `font-family:${labelStyle.fontFamily}`,
      `font-weight:${labelStyle.fontWeight}`,
      `line-height:${labelStyle.lineHeight}`,
      `letter-spacing:${labelStyle.letterSpacing}`,
      `color:${labelStyle.color}`,
      `background:${tabStyle.backgroundColor}`,
      'border-radius:3px',
      'white-space:nowrap',
      'overflow:hidden',
      'text-overflow:ellipsis',
      'display:block',
      'pointer-events:none'
    ].join(';')

    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    window.setTimeout(() => {
      ghost.remove()
    }, 0)

    editorRef.current?.getDomNode()?.blur()
  }

  const onTabDragOver = (e: DragEvent, beforeIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropBeforeIndex(beforeIndex)
  }

  const onTabDrop = (e: DragEvent, beforeIndex: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData(DND_TAB_MIME) || e.dataTransfer.getData('text/plain')
    if (id) {
      reorderTab(id, beforeIndex)
    }
    clearDropUi()
  }

  const onTabBarDragLeave = (e: DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) {
      return
    }
    setDropBeforeIndex(null)
  }

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    const bootModel = editor.getModel()
    applyActiveModel()
    const now = editor.getModel()
    if (bootModel && bootModel !== now) {
      bootModel.dispose()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        minWidth: 0
      }}
    >
      <div
        className="editor-tab-bar app-overlay-scroll"
        role="tablist"
        aria-label="Open editors"
        onDragLeave={onTabBarDragLeave}
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeTabId
          const dragging = draggedTabId === tab.id
          const dropBefore = dropBeforeIndex === index
          const dirty = dirtyPaths.has(tab.path)
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              draggable
              className={`editor-tab ${active ? 'editor-tab-active' : ''} ${dragging ? 'editor-tab-dragging' : ''} ${dropBefore ? 'editor-tab-drop-target' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveTab(tab.id)
                }
              }}
              onDragStart={(e) => onTabDragStart(e, tab.id)}
              onDragEnd={clearDropUi}
              onDragOver={(e) => onTabDragOver(e, index)}
              onDrop={(e) => onTabDrop(e, index)}
            >
              <span className="editor-tab-label" title={tab.path}>
                {tab.title}
              </span>
              <button
                type="button"
                className={`editor-tab-dismiss${dirty ? ' editor-tab-dismiss--dirty' : ''}`}
                draggable={false}
                aria-label={
                  dirty ? `${tab.title} has unsaved changes — close` : `Close ${tab.title}`
                }
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
              >
                {dirty ? (
                  <span className="editor-tab-dirty-bullet" aria-hidden>
                    {'\u25cf'}
                  </span>
                ) : (
                  '×'
                )}
              </button>
            </div>
          )
        })}
        <div
          className={`editor-tab-bar-tail ${dropBeforeIndex === tabs.length ? 'editor-tab-drop-target' : ''}`}
          aria-hidden
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setDropBeforeIndex(tabs.length)
          }}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData(DND_TAB_MIME) || e.dataTransfer.getData('text/plain')
            if (id) {
              reorderTab(id, tabs.length)
            }
            clearDropUi()
          }}
        />
      </div>
      <div
        className={draggedTabId !== null ? 'editor-pane-tab-dragging' : undefined}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          pointerEvents: draggedTabId !== null ? 'none' : 'auto'
        }}
        onDragOver={(e) => {
          if (draggedTabId !== null) {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'none'
          }
        }}
        onDrop={(e) => {
          if (draggedTabId !== null) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="javascript"
          saveViewState
          keepCurrentModel
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 14,
              horizontalScrollbarSize: 12
            }
          }}
          onMount={onMount}
        />
      </div>
    </div>
  )
}
