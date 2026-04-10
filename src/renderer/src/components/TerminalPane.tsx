import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function TerminalPane() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: { background: '#1e1e1e' },
      cursorBlink: true,
      fontFamily: 'Consolas, monospace',
      fontSize: 14,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Update 1: Add a slight delay to the initial fit and send dimensions to backend
    setTimeout(() => {
      fitAddon.fit();
      window.api.resizeTerminal(term.cols, term.rows);
    }, 10);

    term.onData((data) => {
      window.api.onTerminalData(data);
    });

    window.api.receiveTerminalData((data) => {
      term.write(data);
    });

    // Update 2: Send dimensions to backend whenever the window is resized
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      window.api.resizeTerminal(term.cols, term.rows);
    });
    
    resizeObserver.observe(terminalRef.current);

    return () => {
      term.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%', overflow: 'hidden' }} />;
}