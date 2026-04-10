import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import TerminalPane from './components/TerminalPane';
import { useAppStore } from './store/useAppStore';
import './assets/main.css';

function App(): JSX.Element {
  const { files, activeFileContent, initWorkspace, openFile } = useAppStore();

  // Load the workspace when the app starts
  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#1e1e1e', color: '#fff' }}>
      
      {/* 1. Dynamic Explorer Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ padding: '10px', margin: 0, fontSize: '14px', borderBottom: '1px solid #333' }}>EXPLORER</h3>
        <div style={{ overflowY: 'auto', flex: 1, padding: '5px' }}>
          {files.map((file) => (
            <div 
              key={file.path} 
              onClick={() => !file.isDirectory && openFile(file.path)}
              style={{ 
                padding: '5px 10px', 
                cursor: file.isDirectory ? 'default' : 'pointer',
                color: file.isDirectory ? '#aaa' : '#fff',
                fontSize: '13px'
              }}
            >
              {file.isDirectory ? '📁 ' : '📄 '} {file.name}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* 2. Dynamic Monaco Editor */}
        <div style={{ flex: 2 }}>
          <Editor 
            height="100%" 
            defaultLanguage="javascript" 
            theme="vs-dark" 
            value={activeFileContent} // <-- Now linked to state!
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
        
        <div style={{ flex: 1, borderTop: '1px solid #333' }}>
          <TerminalPane />
        </div>
      </div>
    </div>
  )
}

export default App;