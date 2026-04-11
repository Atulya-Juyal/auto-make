/**
 * Tracks drags on the explorer ↔ main horizontal splitter so heavy consumers
 * (e.g. xterm fit) can pause updates until the pointer is released.
 */
let explorerMainGroupResizing = false;

export function setExplorerMainGroupResizing(active: boolean): void {
  const was = explorerMainGroupResizing;
  explorerMainGroupResizing = active;
  if (was && !active) {
    window.dispatchEvent(new CustomEvent('shell-explorer-main-resize-end'));
  }
}

export function isExplorerMainGroupResizing(): boolean {
  return explorerMainGroupResizing;
}
