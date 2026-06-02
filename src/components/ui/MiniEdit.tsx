import { useState, useRef, useEffect, type ReactNode } from 'react';

interface MiniEditProps {
  /** Label displayed to the left of the value. */
  label: string;
  /** Current text value. */
  value: string;
  /** Callback fired on blur / Enter when the value changes. */
  onCommit: (v: string) => void;
  /** Width of the editable area in pixels. Defaults to 120. */
  width?: number;
}

/**
 * Inline editable field. Click to enter edit mode, blur or Enter to save.
 */
export default function MiniEdit({ label, value, onCommit, width = 120 }: MiniEditProps): ReactNode {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when the external value changes
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Auto-focus the input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onCommit(draft);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ color: 'var(--color-ink2)', fontWeight: 600 }}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="num"
          style={{
            width,
            padding: '3px 8px',
            fontSize: 13,
            fontFamily: 'var(--font-cn-body)',
            color: 'var(--color-ink)',
            background: '#fff',
            border: '1.5px solid var(--color-brand)',
            borderRadius: 8,
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(255,107,92,.12)',
          }}
        />
      ) : (
        <span
          className="num"
          onClick={() => setEditing(true)}
          style={{
            width,
            padding: '3px 8px',
            borderRadius: 8,
            border: '1.5px dashed var(--color-line)',
            cursor: 'pointer',
            transition: 'border-color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-line)';
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
