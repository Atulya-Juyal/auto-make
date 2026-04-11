import { useEffect, type ReactElement } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { FileTreeNode } from './components/FileTreeNode';
import TerminalPane from './components/TerminalPane';
import { setExplorerMainGroupResizing } from './shell/explorerMainResize';
import { useAppStore } from './store/useAppStore';
import './assets/main.css';

/** Sidebar width in CSS pixels; stays constant when the window is resized (not percentage-based). */
const EXPLORER_WIDTH_PX = 260;

function App(): ReactElement {
  const { rootEntries, activeFileContent, initWorkspace } = useAppStore();

  // Load the workspace when the app starts
  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  return (
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
          <h3 style={{ padding: '10px', margin: 0, fontSize: '14px', borderBottom: '1px solid #333' }}>
            EXPLORER
          </h3>
          <div
            className="app-overlay-scroll"
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              padding: '5px',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {rootEntries.map((node) => (
              <FileTreeNode key={node.path} node={node} depth={0} />
            ))}
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
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={activeFileContent}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      useShadows: false,
                      verticalScrollbarSize: 14,
                      horizontalScrollbarSize: 12,
                    },
                  }}
                />
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
  );
}

export default App;