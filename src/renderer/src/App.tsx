import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels'
import { EditorTabsPane } from './components/EditorTabsPane'
import { FileTreeNode } from './components/FileTreeNode'
import { SidebarChat } from './components/SidebarChat'
import { Settings } from './components/Settings'
import { TitleBar } from './components/TitleBar'
import { ExplorerChevronDown, ExplorerChevronUp } from './components/explorer/ExplorerIcons'
import TerminalPane, { type TerminalPaneHandle } from './components/TerminalPane'
import { setExplorerMainGroupResizing } from './shell/explorerMainResize'
import { useAppStore } from './store/useAppStore'
import './assets/main.css'

/** Sidebar width in CSS pixels; stays constant when the window is resized (not percentage-based). */
const EXPLORER_WIDTH_PX = 260
const EXPLORER_COLLAPSED_PX = 38
const AI_SIDEBAR_WIDTH_PX = 340
const AI_SIDEBAR_COLLAPSED_PX = 38
/** Matches `.terminal-panel-header` min-height + border (collapsed = header row only). */
const TERMINAL_COLLAPSED_PX = 38

function App(): ReactElement {
  const rootEntries = useAppStore((s) => s.rootEntries)
  const workspacePath = useAppStore((s) => s.workspacePath)
  const initWorkspace = useAppStore((s) => s.initWorkspace)
  const initSecretsState = useAppStore((s) => s.initSecretsState)
  const toggleSettings = useAppStore((s) => s.toggleSettings)
  const setExplorerSelectedPath = useAppStore((s) => s.setExplorerSelectedPath)
  const setExplorerPaneFocused = useAppStore((s) => s.setExplorerPaneFocused)
  const explorerTreeScrollRef = useRef<HTMLDivElement>(null)
  const explorerPanelRef = usePanelRef()
  const aiPanelRef = usePanelRef()
  const terminalPanelRef = usePanelRef()
  const terminalPaneRef = useRef<TerminalPaneHandle>(null)
  const [explorerCollapsed, setExplorerCollapsed] = useState(false)
  const [aiCollapsed, setAiCollapsed] = useState(false)
  const [terminalCollapsed, setTerminalCollapsed] = useState(false)

  // Load the workspace when the app starts
  useEffect(() => {
    void initWorkspace()
    void initSecretsState()
  }, [initWorkspace, initSecretsState])

  const workspaceLabel = workspacePath.split(/[/\\]/).filter(Boolean).pop() ?? workspacePath

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-root">
        <Group
          orientation="horizontal"
          id="explorer-main"
          className="app-group app-group--horizontal"
          onLayoutChange={() => {
            setExplorerMainGroupResizing(true)
          }}
          onLayoutChanged={() => {
            setExplorerMainGroupResizing(false)
          }}
        >
          <Panel
            id="explorer"
            defaultSize={EXPLORER_WIDTH_PX}
            minSize={160}
            maxSize={560}
            groupResizeBehavior="preserve-pixel-size"
            className="app-panel app-panel-explorer"
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
            collapsible
            collapsedSize={EXPLORER_COLLAPSED_PX}
            panelRef={explorerPanelRef}
            onResize={(size) => {
              setExplorerCollapsed(size.inPixels <= EXPLORER_COLLAPSED_PX + 2)
            }}
          >
            <div
              className="explorer-focus-scope"
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                minWidth: 0
              }}
              onFocusCapture={() => setExplorerPaneFocused(true)}
              onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null
                if (next && e.currentTarget.contains(next)) return
                setExplorerPaneFocused(false)
              }}
            >
              <div
                className={`explorer-panel-header${explorerCollapsed ? ' explorer-panel-header--collapsed' : ''}`}
              >
                {!explorerCollapsed ? <span className="explorer-panel-title">EXPLORER</span> : null}
                <button
                  type="button"
                  className="explorer-panel-toggle"
                  aria-label={explorerCollapsed ? 'Expand explorer' : 'Collapse explorer'}
                  title={explorerCollapsed ? 'Expand explorer' : 'Collapse explorer'}
                  onClick={() => {
                    const p = explorerPanelRef.current
                    if (!p) return
                    if (p.isCollapsed()) p.expand()
                    else p.collapse()
                  }}
                >
                  {explorerCollapsed ? '›' : '‹'}
                </button>
              </div>
              {!explorerCollapsed ? (
                <>
                  <div
                    ref={explorerTreeScrollRef}
                    tabIndex={-1}
                    className="app-overlay-scroll explorer-tree-scroll"
                    style={{
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      flex: 1,
                      padding: '5px',
                      minHeight: 0,
                      minWidth: 0
                    }}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest('[data-explorer-row]')) return
                      setExplorerSelectedPath(null)
                      explorerTreeScrollRef.current?.focus({ preventScroll: true })
                    }}
                  >
                    {workspacePath ? (
                      <FileTreeNode
                        key={workspacePath}
                        node={{ name: workspaceLabel, isDirectory: true, path: workspacePath }}
                        depth={0}
                      />
                    ) : (
                      rootEntries.map((node) => <FileTreeNode key={node.path} node={node} depth={0} />)
                    )}
                  </div>
                  <div className="explorer-settings-footer">
                    <button
                      type="button"
                      className="explorer-settings-button"
                      onClick={() => toggleSettings()}
                    >
                      ⚙ Settings
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </Panel>

          <Separator id="sep-explorer-main" className="app-separator app-separator-vertical" />

          <Panel
            id="main"
            defaultSize="60%"
            minSize="35%"
            groupResizeBehavior="preserve-relative-size"
            className="app-panel app-panel-main"
          >
            <Group
              orientation="vertical"
              id="editor-terminal"
              className="app-group app-group--vertical"
            >
              <Panel
                id="editor"
                defaultSize="65%"
                minSize="20%"
                className="app-panel app-panel-editor"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0
                }}
              >
                <div className="app-panel-editor-inner">
                  <EditorTabsPane />
                </div>
              </Panel>

              <Separator
                id="sep-editor-terminal"
                className="app-separator app-separator-horizontal"
              />

              <Panel
                id="terminal"
                defaultSize="35%"
                minSize="12%"
                className="app-panel app-panel-terminal"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0
                }}
                collapsible
                collapsedSize={TERMINAL_COLLAPSED_PX}
                panelRef={terminalPanelRef}
                onResize={(size) => {
                  setTerminalCollapsed(size.inPixels <= TERMINAL_COLLAPSED_PX + 2)
                }}
              >
                <div className="terminal-panel-header">
                  <span className="terminal-panel-title">TERMINAL</span>
                  <div className="terminal-panel-header-actions">
                    {!terminalCollapsed ? (
                      <button
                        type="button"
                        className="terminal-panel-new"
                        aria-label="New terminal"
                        title="New terminal"
                        onClick={() => {
                          terminalPaneRef.current?.createTerminal()
                        }}
                      >
                        +
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="terminal-panel-toggle"
                      aria-label={terminalCollapsed ? 'Expand terminal' : 'Collapse terminal'}
                      title={terminalCollapsed ? 'Expand terminal' : 'Collapse terminal'}
                      onClick={() => {
                        const p = terminalPanelRef.current
                        if (!p) return
                        if (p.isCollapsed()) p.expand()
                        else p.collapse()
                      }}
                    >
                      <span className="terminal-panel-toggle-icon" aria-hidden>
                        {terminalCollapsed ? <ExplorerChevronUp /> : <ExplorerChevronDown />}
                      </span>
                    </button>
                  </div>
                </div>
                {!terminalCollapsed ? (
                  <div className="app-panel-terminal-inner">
                    <TerminalPane ref={terminalPaneRef} />
                  </div>
                ) : null}
              </Panel>
            </Group>
          </Panel>

          <Separator id="sep-main-ai" className="app-separator app-separator-vertical" />

          <Panel
            id="ai-sidebar"
            defaultSize={AI_SIDEBAR_WIDTH_PX}
            minSize={220}
            maxSize={640}
            groupResizeBehavior="preserve-pixel-size"
            className="app-panel app-panel-ai"
            collapsible
            collapsedSize={AI_SIDEBAR_COLLAPSED_PX}
            panelRef={aiPanelRef}
            onResize={(size) => {
              setAiCollapsed(size.inPixels <= AI_SIDEBAR_COLLAPSED_PX + 2)
            }}
          >
            <div className="ai-panel-shell">
              <div className={`ai-panel-header${aiCollapsed ? ' ai-panel-header--collapsed' : ''}`}>
                {!aiCollapsed ? <span className="ai-panel-title">AI ASSISTANT</span> : null}
                <button
                  type="button"
                  className="ai-panel-toggle"
                  aria-label={aiCollapsed ? 'Expand AI sidebar' : 'Collapse AI sidebar'}
                  title={aiCollapsed ? 'Expand AI sidebar' : 'Collapse AI sidebar'}
                  onClick={() => {
                    const p = aiPanelRef.current
                    if (!p) return
                    if (p.isCollapsed()) p.expand()
                    else p.collapse()
                  }}
                >
                  {aiCollapsed ? '‹' : '›'}
                </button>
              </div>
              {!aiCollapsed ? <SidebarChat /> : null}
            </div>
          </Panel>
        </Group>
      </div>
      <Settings />
    </div>
  )
}

export default App
