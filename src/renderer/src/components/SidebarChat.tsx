import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { useAppStore, type AiMode } from '../store/useAppStore'

const AI_MODES: AiMode[] = ['Agent', 'Plan', 'Debug', 'Ask']

export function SidebarChat(): ReactElement {
  const aiMode = useAppStore((s) => s.aiMode)
  const chatHistory = useAppStore((s) => s.chatHistory)
  const isAiThinking = useAppStore((s) => s.isAiThinking)
  const setAiMode = useAppStore((s) => s.setAiMode)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const [modeMenuOpen, setModeMenuOpen] = useState(false)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatHistory])

  useEffect(() => {
    if (!modeMenuOpen) return
    const onDown = (e: MouseEvent): void => {
      if (modeMenuRef.current?.contains(e.target as Node)) return
      setModeMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown, true)
    return () => document.removeEventListener('mousedown', onDown, true)
  }, [modeMenuOpen])

  const submit = (): void => {
    const trimmed = input.trim()
    if (!trimmed || isAiThinking) return
    addChatMessage({ role: 'user', content: trimmed })
    setInput('')
  }

  const onTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="ai-sidebar">
      <div className="ai-sidebar-history app-overlay-scroll">
        {chatHistory.map((m) => (
          <div
            key={m.id}
            className={`ai-message-row ${m.role === 'user' ? 'ai-message-row-user' : 'ai-message-row-ai'}`}
          >
            <div className={`ai-message-bubble ${m.role === 'user' ? 'ai-message-user' : 'ai-message-ai'}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="ai-sidebar-input-wrap">
        <div className="ai-sidebar-composer">
          <textarea
            className="ai-sidebar-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            placeholder="Type a message..."
            disabled={isAiThinking}
            rows={3}
          />
          <div className="ai-sidebar-composer-bar">
            <div className="ai-mode-menu-wrap" ref={modeMenuRef}>
              <button
                type="button"
                className={`title-bar-menu-trigger ai-mode-menu-trigger ${modeMenuOpen ? 'title-bar-menu-trigger-open' : ''}`}
                onClick={() => setModeMenuOpen((o) => !o)}
                aria-expanded={modeMenuOpen}
                aria-haspopup="menu"
              >
                {aiMode}
              </button>
              {modeMenuOpen ? (
                <div className="title-bar-dropdown ai-mode-menu-dropdown" role="menu">
                  {AI_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`title-bar-menu-item ${m === aiMode ? 'ai-mode-menu-item-active' : ''}`}
                      role="menuitemradio"
                      aria-checked={m === aiMode}
                      onClick={() => {
                        setAiMode(m)
                        setModeMenuOpen(false)
                      }}
                    >
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="ai-sidebar-send" onClick={submit} disabled={isAiThinking}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
