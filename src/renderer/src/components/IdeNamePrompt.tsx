import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';

export interface IdeNamePromptProps {
  open: boolean;
  title: string;
  initialValue: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** Replaces `window.prompt` (not available in hardened Electron renderers). */
export function IdeNamePrompt({
  open,
  title,
  initialValue,
  onSubmit,
  onClose,
}: IdeNamePromptProps): ReactElement | null {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <div
      className="ide-name-prompt-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ide-name-prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ide-name-prompt-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="ide-name-prompt-title" className="ide-name-prompt-title">
          {title}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="ide-name-prompt-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="ide-name-prompt-actions">
            <button type="button" className="ide-name-prompt-btn ide-name-prompt-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ide-name-prompt-btn ide-name-prompt-btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
