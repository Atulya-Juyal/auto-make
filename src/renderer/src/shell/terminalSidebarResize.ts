/**
 * Tracks drags on the terminal session list ↔ output splitter so xterm can defer
 * fit until the pointer is released (same idea as explorer ↔ main).
 */
let terminalSidebarResizing = false

export function setTerminalSidebarResizing(active: boolean): void {
  const was = terminalSidebarResizing
  terminalSidebarResizing = active
  if (was && !active) {
    window.dispatchEvent(new CustomEvent('shell-terminal-sidebar-resize-end'))
  }
}

export function isTerminalSidebarResizing(): boolean {
  return terminalSidebarResizing
}
