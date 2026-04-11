import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { isExplorerMainGroupResizing } from '../shell/explorerMainResize';
import 'xterm/css/xterm.css';

/** When not dragging the explorer splitter, cap reflow rate (vertical split / window resize). */
const FIT_THROTTLE_MS = 72;
const FIT_TRAIL_MS = 72;

const EXPLORER_RESIZE_END = 'shell-explorer-main-resize-end';

export default function TerminalPane() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    container.replaceChildren();

    const term = new Terminal({
      theme: { background: '#1e1e1e' },
      cursorBlink: true,
      fontFamily: 'Consolas, monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);

    let lastCols = -1;
    let lastRows = -1;
    let lastThrottleFitAt = 0;
    let trailTimeout = 0;
    let rafId = 0;

    const applyFit = () => {
      const el = terminalRef.current;
      if (!el || el.clientWidth < 2 || el.clientHeight < 2) {
        return;
      }
      try {
        fitAddon.fit();
      } catch {
        return;
      }
      const c = term.cols;
      const r = term.rows;
      if (c > 0 && r > 0 && (c !== lastCols || r !== lastRows)) {
        lastCols = c;
        lastRows = r;
        window.api.resizeTerminal(c, r);
      }
    };

    const runFitInRaf = () => {
      rafId = 0;
      applyFit();
    };

    const scheduleFit = () => {
      const now = performance.now();

      window.clearTimeout(trailTimeout);
      trailTimeout = window.setTimeout(() => {
        trailTimeout = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(runFitInRaf);
      }, FIT_TRAIL_MS);

      if (now - lastThrottleFitAt < FIT_THROTTLE_MS) {
        return;
      }
      lastThrottleFitAt = now;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(runFitInRaf);
    };

    const onExplorerMainResizeEnd = () => {
      window.clearTimeout(trailTimeout);
      trailTimeout = 0;
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastThrottleFitAt = performance.now();
      requestAnimationFrame(runFitInRaf);
    };

    window.setTimeout(() => {
      lastThrottleFitAt = performance.now();
      requestAnimationFrame(runFitInRaf);
    }, 10);

    window.addEventListener(EXPLORER_RESIZE_END, onExplorerMainResizeEnd);

    term.onData((data) => {
      window.api.onTerminalData(data);
    });

    const unsubscribeTerminalData = window.api.receiveTerminalData((data) => {
      term.write(data);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (isExplorerMainGroupResizing()) {
        return;
      }
      scheduleFit();
    });
    resizeObserver.observe(container);

    return () => {
      unsubscribeTerminalData();
      window.removeEventListener(EXPLORER_RESIZE_END, onExplorerMainResizeEnd);
      window.clearTimeout(trailTimeout);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      term.dispose();
      container.replaceChildren();
    };
  }, []);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%', overflow: 'hidden' }} />;
}
