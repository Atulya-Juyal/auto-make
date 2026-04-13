import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Settings(): ReactElement | null {
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen)
  const hasSavedApiKey = useAppStore((s) => s.hasSavedApiKey)
  const isSecureStorageAvailable = useAppStore((s) => s.isSecureStorageAvailable)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const saveApiKeySecure = useAppStore((s) => s.saveApiKeySecure)

  const [draftKey, setDraftKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [view, setView] = useState<'saved' | 'confirm-replace' | 'edit'>('edit')
  const [testMessage, setTestMessage] = useState('')
  const [testOk, setTestOk] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSettingsOpen) return
    setDraftKey('')
    setView(hasSavedApiKey ? 'saved' : 'edit')
    setTestMessage('')
    setTestOk(null)
    const t = window.setTimeout(() => {
      if (!hasSavedApiKey) inputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [isSettingsOpen, hasSavedApiKey])

  useEffect(() => {
    if (!isSettingsOpen) return
    if (view !== 'edit') return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [isSettingsOpen, view])

  useEffect(() => {
    if (!isSettingsOpen) return
    const onKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape' && !isSaving) {
        e.preventDefault()
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSettingsOpen, isSaving, setSettingsOpen])

  if (!isSettingsOpen) return null

  const close = (): void => {
    if (isSaving) return
    setSettingsOpen(false)
  }

  const onSave = async (): Promise<void> => {
    if (isSaving || isTesting) return
    setIsSaving(true)
    try {
      await saveApiKeySecure(draftKey)
      setDraftKey('')
      setSettingsOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`Failed to save API key: ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }

  const onTestKey = async (): Promise<void> => {
    const key = draftKey.trim()
    if (!key) {
      setTestOk(false)
      setTestMessage('Enter an API key first.')
      return
    }
    setIsTesting(true)
    setTestMessage('Testing key against provider API...')
    setTestOk(null)

    const ctrl = new AbortController()
    const timeout = window.setTimeout(() => ctrl.abort(), 12000)

    try {
      if (/^AIza[0-9A-Za-z_-]{20,}$/.test(key)) {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
          { method: 'GET', signal: ctrl.signal }
        )
        if (resp.ok) {
          setTestOk(true)
          setTestMessage('Gemini API key is valid.')
        } else {
          setTestOk(false)
          setTestMessage(`Gemini key rejected (HTTP ${resp.status}).`)
        }
        return
      }

      if (/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
        const resp = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${key}` },
          signal: ctrl.signal
        })
        if (resp.ok) {
          setTestOk(true)
          setTestMessage('OpenAI API key is valid.')
        } else {
          setTestOk(false)
          setTestMessage(`OpenAI key rejected (HTTP ${resp.status}).`)
        }
        return
      }

      setTestOk(false)
      setTestMessage('Unknown key format. Use Gemini (AIza...) or OpenAI (sk-...).')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setTestOk(false)
        setTestMessage('Test timed out. Check network and try again.')
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        setTestOk(false)
        setTestMessage(`Test failed: ${msg}`)
      }
    } finally {
      window.clearTimeout(timeout)
      setIsTesting(false)
    }
  }

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (view !== 'edit') return
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void onSave()
    }
  }

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={close}>
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onDialogKeyDown}
      >
        <h2 className="settings-title">Settings</h2>
        {view === 'saved' ? (
          <div className="settings-saved-wrap">
            <p className="settings-label">Gemini key: (AIza...)</p>
            <p className="settings-note">A key is saved securely and hidden.</p>
          </div>
        ) : null}
        {view === 'confirm-replace' ? (
          <div className="settings-saved-wrap">
            <p className="settings-label">Replace saved key?</p>
            <p className="settings-note">
              This will overwrite your existing secure key. Continue to enter a new one.
            </p>
          </div>
        ) : null}
        {view === 'edit' ? (
          <>
            <label className="settings-label" htmlFor="settings-api-key">
              Gemini/OpenAI API Key
            </label>
            <input
              ref={inputRef}
              id="settings-api-key"
              type="password"
              className="settings-input"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder={
                hasSavedApiKey ? 'Saved key is hidden. Paste a new key to replace it.' : 'Paste your API key'
              }
              autoComplete="off"
              spellCheck={false}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
          </>
        ) : null}
        <p className="settings-note">
          {isSecureStorageAvailable
            ? 'Secure storage is active (OS encryption).'
            : 'Secure storage unavailable. Key is kept in memory for this session only.'}
        </p>
        {view === 'edit' && testMessage ? (
          <p className={`settings-test-result ${testOk ? 'settings-test-result-ok' : 'settings-test-result-bad'}`}>
            {testMessage}
          </p>
        ) : null}
        <div className="settings-actions">
          <button type="button" className="settings-btn settings-btn-secondary" onClick={close}>
            Cancel
          </button>
          {view === 'saved' ? (
            <button
              type="button"
              className="settings-btn settings-btn-primary"
              onClick={() => setView('confirm-replace')}
            >
              Replace Key
            </button>
          ) : null}
          {view === 'confirm-replace' ? (
            <button
              type="button"
              className="settings-btn settings-btn-primary"
              onClick={() => {
                setView('edit')
                setTestMessage('')
                setTestOk(null)
              }}
            >
              Yes, Continue
            </button>
          ) : null}
          {view === 'edit' ? (
            <>
              <button
                type="button"
                className="settings-btn settings-btn-secondary"
                onClick={() => void onTestKey()}
                disabled={isSaving || isTesting}
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
              <button
                type="button"
                className="settings-btn settings-btn-primary"
                onClick={() => void onSave()}
                disabled={isSaving || isTesting}
              >
                {isSaving ? 'Saving...' : 'Save & Close'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
