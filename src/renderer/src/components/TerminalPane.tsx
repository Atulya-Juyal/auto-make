import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement
} from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { isExplorerMainGroupResizing } from '../shell/explorerMainResize'
import {
  isTerminalSidebarResizing,
  setTerminalSidebarResizing
} from '../shell/terminalSidebarResize'
import 'xterm/css/xterm.css'

/** When not dragging splitters, cap reflow rate (vertical split / window resize). */
const FIT_THROTTLE_MS = 72
const FIT_TRAIL_MS = 72

const SPLIT_RESIZE_END_EVENTS = [
  'shell-explorer-main-resize-end',
  'shell-terminal-sidebar-resize-end'
] as const

/** Default width of the terminal session list (matches VS Code–ish density). */
const TERMINAL_SIDEBAR_DEFAULT_PX = 200
const TERMINAL_SIDEBAR_MIN_PX = 120
const TERMINAL_SIDEBAR_MAX_PX = 420

function TerminalSidebarIcon(): ReactElement {
  return (
    <svg
      className="terminal-sidebar-row-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.5 3.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M4.5 7.5 6 9l-1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M7.5 10.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function TerminalSession({
  terminalId,
  isActive
}: {
  terminalId: string
  isActive: boolean
}): ReactElement {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)

  useEffect(() => {
    const container = terminalRef.current
    if (!container) return

    container.replaceChildren()

    const term = new Terminal({
      theme: { background: '#1e1e1e' },
      cursorBlink: true,
      fontFamily: 'Consolas, monospace',
      fontSize: 14
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(container)
    termInstanceRef.current = term

    let lastCols = -1
    let lastRows = -1
    let lastThrottleFitAt = 0
    let trailTimeout = 0
    let rafId = 0

    const applyFit = () => {
      const el = terminalRef.current
      if (!el || el.clientWidth < 2 || el.clientHeight < 2) {
        return
      }
      try {
        fitAddon.fit()
      } catch {
        return
      }
      const c = term.cols
      const r = term.rows
      if (c > 0 && r > 0 && (c !== lastCols || r !== lastRows)) {
        lastCols = c
        lastRows = r
        window.api.resizeTerminal(terminalId, c, r)
      }
    }

    const runFitInRaf = () => {
      rafId = 0
      applyFit()
    }

    const scheduleFit = () => {
      const now = performance.now()

      window.clearTimeout(trailTimeout)
      trailTimeout = window.setTimeout(() => {
        trailTimeout = 0
        if (rafId) {
          cancelAnimationFrame(rafId)
        }
        rafId = requestAnimationFrame(runFitInRaf)
      }, FIT_TRAIL_MS)

      if (now - lastThrottleFitAt < FIT_THROTTLE_MS) {
        return
      }
      lastThrottleFitAt = now
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(runFitInRaf)
    }

    const onSplitResizeEnd = () => {
      window.clearTimeout(trailTimeout)
      trailTimeout = 0
      cancelAnimationFrame(rafId)
      rafId = 0
      lastThrottleFitAt = performance.now()
      requestAnimationFrame(runFitInRaf)
    }

    window.setTimeout(() => {
      lastThrottleFitAt = performance.now()
      requestAnimationFrame(runFitInRaf)
    }, 10)

    for (const ev of SPLIT_RESIZE_END_EVENTS) {
      window.addEventListener(ev, onSplitResizeEnd)
    }

    term.onData((data) => {
      window.api.onTerminalData(terminalId, data)
    })

    const unsubscribeTerminalData = window.api.receiveTerminalData((payload) => {
      if (payload.id === terminalId) {
        term.write(payload.data)
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      if (isExplorerMainGroupResizing() || isTerminalSidebarResizing()) {
        return
      }
      scheduleFit()
    })
    resizeObserver.observe(container)

    return () => {
      unsubscribeTerminalData()
      for (const ev of SPLIT_RESIZE_END_EVENTS) {
        window.removeEventListener(ev, onSplitResizeEnd)
      }
      window.clearTimeout(trailTimeout)
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      termInstanceRef.current = null
      term.dispose()
      container.replaceChildren()
    }
  }, [terminalId])

  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(() => {
        termInstanceRef.current?.focus()
      })
    }
  }, [isActive])

  return <div ref={terminalRef} style={{ height: '100%', width: '100%', overflow: 'hidden' }} />
}

export type TerminalPaneHandle = {
  createTerminal: () => void
}

const TerminalPane = forwardRef<TerminalPaneHandle>(function TerminalPane(_props, ref) {
  const [terminals, setTerminals] = useState<{ id: string; label: string }[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    void window.api.terminalBootstrap().then(({ terminals: list }) => {
      setTerminals(list)
      setActiveId(list[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    return window.api.onTerminalSessionsReset(() => {
      void window.api.terminalBootstrap().then(({ terminals: list }) => {
        setTerminals(list)
        setActiveId(list[0]?.id ?? null)
      })
    })
  }, [])

  const addTerminal = useCallback((): void => {
    void window.api.terminalCreate().then((row) => {
      setTerminals((prev) => [...prev, row])
      setActiveId(row.id)
    })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      createTerminal: () => {
        addTerminal()
      }
    }),
    [addTerminal]
  )

  const removeTerminal = (id: string): void => {
    setTerminals((prev) => {
      if (prev.length <= 1) return prev
      void window.api.terminalDispose(id).then(() => {
        setTerminals((p) => {
          const next = p.filter((t) => t.id !== id)
          setActiveId((cur) => (cur !== id ? cur : (next[0]?.id ?? null)))
          return next
        })
      })
      return prev
    })
  }

  const selectSession = (id: string): void => {
    setActiveId(id)
  }

  if (terminals.length === 0) {
    return <div className="terminal-pane-root terminal-pane-root--empty" />
  }

  const shellLabel = terminals[0]?.label ?? 'terminal'
  const showSessionSidebar = terminals.length > 1

  const sessionStack = (
    <div className="terminal-session-stack">
      {terminals.map((t) => (
        <div
          key={t.id}
          className="terminal-session-layer"
          data-active={t.id === activeId ? 'true' : 'false'}
        >
          <TerminalSession terminalId={t.id} isActive={t.id === activeId} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="terminal-pane-root">
      <Group
        orientation="horizontal"
        id="terminal-inner"
        className="app-group app-group--horizontal terminal-pane-split"
        onLayoutChange={() => {
          if (showSessionSidebar) setTerminalSidebarResizing(true)
        }}
        onLayoutChanged={() => {
          if (showSessionSidebar) setTerminalSidebarResizing(false)
        }}
      >
        <Panel
          id="terminal-output"
          minSize="25%"
          className="terminal-output-panel"
          style={{
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {sessionStack}
        </Panel>

        {showSessionSidebar ? (
          <>
            <Separator
              id="sep-terminal-output-sidebar"
              className="app-separator app-separator-vertical"
            />
            <Panel
              id="terminal-session-sidebar"
              defaultSize={TERMINAL_SIDEBAR_DEFAULT_PX}
              minSize={TERMINAL_SIDEBAR_MIN_PX}
              maxSize={TERMINAL_SIDEBAR_MAX_PX}
              groupResizeBehavior="preserve-pixel-size"
              className="terminal-sidebar-panel"
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}
            >
              <div
                className="terminal-sidebar-list app-overlay-scroll"
                role="tablist"
                aria-label="Terminal sessions"
              >
                {terminals.map((t) => (
                  <div
                    key={t.id}
                    role="tab"
                    aria-selected={t.id === activeId}
                    className={`terminal-sidebar-row${t.id === activeId ? ' terminal-sidebar-row--active' : ''}`}
                  >
                    <button
                      type="button"
                      className="terminal-sidebar-row-main"
                      onClick={() => selectSession(t.id)}
                      title={shellLabel}
                    >
                      <TerminalSidebarIcon />
                      <span className="terminal-sidebar-row-label">{t.label}</span>
                    </button>
                    <button
                      type="button"
                      className="terminal-sidebar-row-close"
                      aria-label={`Close ${shellLabel} session`}
                      title="Kill terminal"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTerminal(t.id)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        ) : null}
      </Group>
    </div>
  )
})

export default TerminalPane
