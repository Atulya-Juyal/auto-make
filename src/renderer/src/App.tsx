import { useEffect, useRef, type ReactElement } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { EditorTabsPane } from './components/EditorTabsPane';
import { FileTreeNode } from './components/FileTreeNode';
import { TitleBar } from './components/TitleBar';
import TerminalPane from './components/TerminalPane';
import { setExplorerMainGroupResizing } from './shell/explorerMainResize';
import { useAppStore } from './store/useAppStore';
import './assets/main.css';

/** Sidebar width in CSS pixels; stays constant when the window is resized (not percentage-based). */
const EXPLORER_WIDTH_PX = 260;

function App(): ReactElement {
  const rootEntries = useAppStore((s) => s.rootEntries);
  const initWorkspace = useAppStore((s) => s.initWorkspace);
  const setExplorerSelectedPath = useAppStore((s) => s.setExplorerSelectedPath);
  const setExplorerPaneFocused = useAppStore((s) => s.setExplorerPaneFocused);
  const explorerTreeScrollRef = useRef<HTMLDivElement>(null);

  // Load the workspace when the app starts
  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-root">
        <Group
          orientation="horizontal"
          id="explorer-main"
          className="app-group app-group--horizontal"
          onLayoutChange={() => {
            setExplorerMainGroupResizing(true);
          }}
          onLayoutChanged={() => {
            setExplorerMainGroupResizing(false);
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
        >
          <div
            className="explorer-focus-scope"
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            onFocusCapture={() => setExplorerPaneFocused(true)}
            onBlurCapture={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && e.currentTarget.contains(next)) return;
              setExplorerPaneFocused(false);
            }}
          >
            <h3 style={{ padding: '10px', margin: 0, fontSize: '14px', borderBottom: '1px solid #333' }}>
              EXPLORER
            </h3>
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
                minWidth: 0,
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest('[data-explorer-row]')) return;
                setExplorerSelectedPath(null);
                explorerTreeScrollRef.current?.focus({ preventScroll: true });
              }}
            >
              {rootEntries.map((node) => (
                <FileTreeNode key={node.path} node={node} depth={0} />
              ))}
            </div>
          </div>
        </Panel>

        <Separator id="sep-explorer-main" className="app-separator app-separator-vertical" />

        <Panel
          id="main"
          minSize="35%"
          groupResizeBehavior="preserve-relative-size"
          className="app-panel app-panel-main"
        >
          <Group orientation="vertical" id="editor-terminal" className="app-group app-group--vertical">
            <Panel
              id="editor"
              defaultSize="65%"
              minSize="20%"
              className="app-panel app-panel-editor"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <div className="app-panel-editor-inner">
                <EditorTabsPane />
              </div>
            </Panel>

            <Separator id="sep-editor-terminal" className="app-separator app-separator-horizontal" />

            <Panel
              id="terminal"
              defaultSize="35%"
              minSize="12%"
              className="app-panel app-panel-terminal"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <div className="app-panel-terminal-inner">
                <TerminalPane />
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>
      </div>
    </div>
  );
}

export default App;