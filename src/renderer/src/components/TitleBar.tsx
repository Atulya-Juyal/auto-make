import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IdeNamePrompt } from './IdeNamePrompt';
import appIcon from '../assets/app-icon.png';

type NamePromptKind = 'file' | 'folder' | null;

/** App logo used across title bar + packaged app icons. */
function AppLogo(): ReactElement {
  return (
    <img src={appIcon} alt="" aria-hidden className="title-bar-logo title-bar-logo--adaptive" />
  );
}

export function TitleBar(): ReactElement {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [namePromptKind, setNamePromptKind] = useState<NamePromptKind>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const createNewFile = useAppStore((s) => s.createNewFile);
  const createNewFolder = useAppStore((s) => s.createNewFolder);
  const saveActiveTab = useAppStore((s) => s.saveActiveTab);
  const openFileFromDialog = useAppStore((s) => s.openFileFromDialog);
  const openFolderFromDialog = useAppStore((s) => s.openFolderFromDialog);

  useEffect(() => {
    void window.api.winIsMaximized().then(setMaximized);
    return window.api.onWinMaximizeChanged(setMaximized);
  }, []);

  useEffect(() => {
    if (!fileMenuOpen) return;
    const onDown = (e: MouseEvent): void => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setFileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [fileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (namePromptKind !== null) return;
      if (e.defaultPrevented) return;
      if (!e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (e.shiftKey && key === 'n') {
        e.preventDefault();
        setNamePromptKind('folder');
        return;
      }
      if (!e.shiftKey && key === 'n') {
        e.preventDefault();
        setNamePromptKind('file');
        return;
      }
      if (!e.shiftKey && key === 's') {
        e.preventDefault();
        void saveActiveTab();
        return;
      }
      if (e.shiftKey && key === 'o') {
        e.preventDefault();
        void openFolderFromDialog();
        return;
      }
      if (!e.shiftKey && key === 'o') {
        e.preventDefault();
        void openFileFromDialog();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [
    namePromptKind,
    createNewFile,
    createNewFolder,
    saveActiveTab,
    openFileFromDialog,
    openFolderFromDialog,
  ]);

  const runNewFile = (): void => {
    setFileMenuOpen(false);
    setNamePromptKind('file');
  };

  const runNewFolder = (): void => {
    setFileMenuOpen(false);
    setNamePromptKind('folder');
  };

  const handleNamePromptSubmit = useCallback(
    (name: string) => {
      const kind = namePromptKind;
      if (!kind) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      setNamePromptKind(null);
      if (kind === 'file') void createNewFile(trimmed);
      else void createNewFolder(trimmed);
    },
    [namePromptKind, createNewFile, createNewFolder],
  );

  const closeNamePrompt = useCallback(() => setNamePromptKind(null), []);

  const runSave = (): void => {
    setFileMenuOpen(false);
    void saveActiveTab();
  };

  const runOpenFile = (): void => {
    setFileMenuOpen(false);
    void openFileFromDialog();
  };

  const runOpenFolder = (): void => {
    setFileMenuOpen(false);
    void openFolderFromDialog();
  };

  const onTitleBarDblClick = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('.title-bar-no-max-dbl')) return;
    void window.api.winMaximizeToggle().then(() => window.api.winIsMaximized().then(setMaximized));
  };

  return (
    <>
      <IdeNamePrompt
        open={namePromptKind !== null}
        title={namePromptKind === 'folder' ? 'New Folder' : 'New File'}
        initialValue={namePromptKind === 'folder' ? 'new-folder' : 'untitled.txt'}
        onSubmit={handleNamePromptSubmit}
        onClose={closeNamePrompt}
      />
    <header className="title-bar" onDoubleClick={onTitleBarDblClick}>
      <div className="title-bar-leading title-bar-no-max-dbl">
        <AppLogo />
        <span className="title-bar-app-name">AutoMake</span>
        <div className="title-bar-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`title-bar-menu-trigger ${fileMenuOpen ? 'title-bar-menu-trigger-open' : ''}`}
            onClick={() => setFileMenuOpen((o) => !o)}
            aria-expanded={fileMenuOpen}
            aria-haspopup="menu"
          >
            File
          </button>
          {fileMenuOpen ? (
            <div className="title-bar-dropdown" role="menu">
              <button type="button" className="title-bar-menu-item" role="menuitem" onClick={runNewFile}>
                <span>New File</span>
                <kbd className="title-bar-kbd">Ctrl+N</kbd>
              </button>
              <button type="button" className="title-bar-menu-item" role="menuitem" onClick={runNewFolder}>
                <span>New Folder</span>
                <kbd className="title-bar-kbd">Ctrl+Shift+N</kbd>
              </button>
              <button type="button" className="title-bar-menu-item" role="menuitem" onClick={runSave}>
                <span>Save</span>
                <kbd className="title-bar-kbd">Ctrl+S</kbd>
              </button>
              <div className="title-bar-menu-sep" role="separator" />
              <button type="button" className="title-bar-menu-item" role="menuitem" onClick={runOpenFile}>
                <span>Open File…</span>
                <kbd className="title-bar-kbd">Ctrl+O</kbd>
              </button>
              <button type="button" className="title-bar-menu-item" role="menuitem" onClick={runOpenFolder}>
                <span>Open Folder…</span>
                <kbd className="title-bar-kbd">Ctrl+Shift+O</kbd>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="title-bar-drag" aria-hidden />
      <div className="title-bar-controls title-bar-no-max-dbl">
        <button
          type="button"
          className="title-bar-win-btn title-bar-win-min"
          aria-label="Minimize"
          onClick={() => void window.api.winMinimize()}
        >
          <span />
        </button>
        <button
          type="button"
          className="title-bar-win-btn title-bar-win-max"
          aria-label={maximized ? 'Restore' : 'Maximize'}
          onClick={() =>
            void window.api.winMaximizeToggle().then(() => window.api.winIsMaximized().then(setMaximized))
          }
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path
                fill="currentColor"
                d="M2 4h5v5H2V4zm1-3h5v5H3V1z"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="title-bar-win-btn title-bar-win-close"
          aria-label="Close"
          onClick={() => void window.api.winClose()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M1 1l8 8M9 1L1 9" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </header>
    </>
  );
}
